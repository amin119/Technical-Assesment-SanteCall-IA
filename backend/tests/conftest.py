"""Test fixtures. Tests run against a REAL CockroachDB (docker compose up -d cockroach).

Why not mocks? The things we test (serializable transactions, constraints, retries) only exist
inside the database. A mock would pass while the real system overbooks.
"""

import os
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Any

import psycopg
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from psycopg_pool import AsyncConnectionPool

from app.db import init_schema, make_pool
from app.ingest.normalize import normalize_record
from app.ingest.runner import upsert_events
from app.main import app

ADMIN_URL = os.getenv("SORTIR_TEST_ADMIN_URL", "postgresql://root@localhost:26257/defaultdb?sslmode=disable")
TEST_URL = ADMIN_URL.replace("/defaultdb", "/sortir_test")


@pytest_asyncio.fixture(scope="session")
async def pool() -> AsyncIterator[AsyncConnectionPool]:
    async with await psycopg.AsyncConnection.connect(ADMIN_URL, autocommit=True) as conn:
        await conn.execute("CREATE DATABASE IF NOT EXISTS sortir_test")
    pool = make_pool(TEST_URL)
    await pool.open(wait=True, timeout=30)
    await init_schema(pool)
    yield pool
    await pool.close()


@pytest_asyncio.fixture(autouse=True)
async def clean_tables(pool: AsyncConnectionPool) -> None:
    async with pool.connection() as conn:
        await conn.execute("DELETE FROM bookings")
        await conn.execute("DELETE FROM events")


@pytest_asyncio.fixture
async def client(pool: AsyncConnectionPool) -> AsyncIterator[AsyncClient]:
    app.state.pool = pool  # the lifespan is not run by ASGITransport, so inject the pool
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


def raw_record(event_id: str = "1", **overrides: Any) -> dict[str, Any]:
    """A raw Paris Open Data record, shaped like the real API, starting in 2 days by default."""
    start = datetime.now(UTC) + timedelta(days=2)
    record: dict[str, Any] = {
        "id": event_id,
        "title": f"Event {event_id}",
        "lead_text": "<p>Une <b>belle</b> soirée.</p>",
        "description": "<p>Détails.</p>",
        "date_start": start.isoformat(),
        "date_end": (start + timedelta(hours=2)).isoformat(),
        "date_description": "Le samedi<br />de 20h à 22h",
        "address_name": "La Cigale",
        "address_street": "120 boulevard de Rochechouart",
        "address_zipcode": "75018",
        "lat_lon": {"lat": 48.8823, "lon": 2.3402},
        "price_type": "payant",
        "price_detail": "<p>20 euros</p>",
        "url": f"https://www.paris.fr/evenements/{event_id}",
        "qfap_tags": "Concert",
        "updated_at": datetime.now(UTC).isoformat(),
    }
    record.update(overrides)
    return record


async def seed(pool: AsyncConnectionPool, *records: dict[str, Any], capacity: int | None = None) -> None:
    rows = []
    for record in records:
        row = normalize_record(record)
        assert row is not None
        if capacity is not None:
            row["capacity"] = capacity
        rows.append(row)
    await upsert_events(pool, rows)
