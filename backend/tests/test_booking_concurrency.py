"""The point of the project: concurrent reservations must never overbook."""

import asyncio
from collections import Counter

from httpx import AsyncClient
from psycopg_pool import AsyncConnectionPool

from tests.conftest import raw_record, seed


async def _db_state(pool: AsyncConnectionPool, event_id: str) -> tuple[int, int]:
    async with pool.connection() as conn:
        cur = await conn.execute("SELECT seats_taken FROM events WHERE id = %s", (event_id,))
        event = await cur.fetchone()
        cur = await conn.execute("SELECT count(*) AS n FROM bookings WHERE event_id = %s", (event_id,))
        count = await cur.fetchone()
    return event["seats_taken"], count["n"]


async def test_last_seats_are_never_overbooked(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    """50 different people ask for 10 seats at the same instant: exactly 10 win."""
    await seed(pool, raw_record("race"), capacity=10)

    responses = await asyncio.gather(
        *[client.post("/api/events/race/bookings", json={"email": f"user{i}@example.com"}) for i in range(50)]
    )

    statuses = Counter(r.status_code for r in responses)
    assert statuses == {201: 10, 409: 40}
    assert {r.json()["error"]["code"] for r in responses if r.status_code == 409} == {"sold_out"}
    seats_taken, bookings = await _db_state(pool, "race")
    assert seats_taken == 10  # counter and rows agree...
    assert bookings == 10  # ...and neither exceeds capacity


async def test_same_person_clicking_many_times_books_once(
    pool: AsyncConnectionPool, client: AsyncClient
) -> None:
    """20 simultaneous requests with the same email: one booking, one seat used."""
    await seed(pool, raw_record("dup"), capacity=10)

    responses = await asyncio.gather(
        *[client.post("/api/events/dup/bookings", json={"email": "same@example.com"}) for _ in range(20)]
    )

    assert Counter(r.status_code for r in responses) == {201: 1, 409: 19}
    assert {r.json()["error"]["code"] for r in responses if r.status_code == 409} == {"already_booked"}
    assert await _db_state(pool, "dup") == (1, 1)


async def test_email_is_case_insensitive(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    await seed(pool, raw_record("case"), capacity=10)
    first = await client.post("/api/events/case/bookings", json={"email": "Ana@Example.com"})
    second = await client.post("/api/events/case/bookings", json={"email": "ana@example.COM"})
    assert (first.status_code, second.status_code) == (201, 409)


async def test_ingestion_does_not_reset_reservations(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    """Re-running ingestion (which upserts) while people book must keep the seat counters."""
    await seed(pool, raw_record("keep"), capacity=10)
    await client.post("/api/events/keep/bookings", json={"email": "a@example.com"})

    await seed(pool, raw_record("keep", title="Renamed upstream"))  # same id, new title

    body = (await client.get("/api/events/keep")).json()
    assert body["title"] == "Renamed upstream"
    assert (body["capacity"], body["seats_taken"]) == (10, 1)
