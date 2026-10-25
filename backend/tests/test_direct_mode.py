"""Serverless mode (Vercel): every request opens its own connection. The guarantee must still hold."""

import asyncio
from collections import Counter
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from psycopg_pool import AsyncConnectionPool

from app.db import DirectConnections
from app.main import app
from tests.conftest import TEST_URL, raw_record, seed


@pytest_asyncio.fixture
async def direct_client(pool: AsyncConnectionPool) -> AsyncIterator[AsyncClient]:
    app.state.pool = DirectConnections(TEST_URL)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.state.pool = pool  # leave the shared pool in place for the other tests


async def test_search_and_health_work_without_a_pool(
    pool: AsyncConnectionPool, direct_client: AsyncClient
) -> None:
    await seed(pool, raw_record("direct-1"))
    assert (await direct_client.get("/api/health")).json()["status"] == "ok"
    body = (await direct_client.get("/api/events")).json()
    assert [e["id"] for e in body["items"]] == ["direct-1"]


async def test_last_seats_are_never_overbooked_with_direct_connections(
    pool: AsyncConnectionPool, direct_client: AsyncClient
) -> None:
    await seed(pool, raw_record("direct-race"), capacity=10)

    responses = await asyncio.gather(
        *[
            direct_client.post("/api/events/direct-race/bookings", json={"email": f"user{i}@example.com"})
            for i in range(50)
        ]
    )

    assert Counter(r.status_code for r in responses) == {201: 10, 409: 40}
    async with pool.connection() as conn:
        cur = await conn.execute("SELECT seats_taken FROM events WHERE id = 'direct-race'")
        assert (await cur.fetchone())["seats_taken"] == 10
