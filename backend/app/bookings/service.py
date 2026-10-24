"""Seat reservation. READ .claude/skills/concurrency-cockroachdb/SKILL.md BEFORE EDITING.

Goal: if 50 people ask for the last 10 seats at the same moment, exactly 10 succeed.
"""

from typing import Any

import psycopg
from psycopg_pool import AsyncConnectionPool

from app.db import run_transaction


class EventNotFound(Exception):
    pass


class SoldOut(Exception):
    pass


class AlreadyBooked(Exception):
    pass


async def reserve_seat(pool: AsyncConnectionPool, event_id: str, email: str) -> dict[str, Any]:
    email = email.strip().lower()

    async def work(conn: psycopg.AsyncConnection) -> dict[str, Any]:
        # Step 1: claim "one seat per person". The UNIQUE constraint makes this atomic, and a
        # duplicate stops here without ever touching the busy `events` row.
        try:
            cur = await conn.execute(
                "INSERT INTO bookings (event_id, email) VALUES (%s, %s) "
                "ON CONFLICT (event_id, email) DO NOTHING RETURNING id, created_at",
                (event_id, email),
            )
        except psycopg.errors.ForeignKeyViolation:
            raise EventNotFound from None
        booking = await cur.fetchone()
        if booking is None:
            raise AlreadyBooked

        # Step 2: take a seat. Check and write are ONE statement, so there is no gap between
        # "is there room?" and "take it" for another request to slip into.
        cur = await conn.execute(
            "UPDATE events SET seats_taken = seats_taken + 1 "
            "WHERE id = %s AND seats_taken < capacity "
            "RETURNING capacity - seats_taken AS seats_left",
            (event_id,),
        )
        event = await cur.fetchone()
        if event is None:
            # No row updated: the event is full. Raising rolls back step 1 too.
            raise SoldOut

        return {
            "id": booking["id"],
            "event_id": event_id,
            "email": email,
            "created_at": booking["created_at"],
            "seats_left": event["seats_left"],
        }

    return await run_transaction(pool, work)
