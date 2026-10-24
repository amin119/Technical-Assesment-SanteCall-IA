from httpx import AsyncClient
from psycopg_pool import AsyncConnectionPool

from tests.conftest import raw_record, seed


async def test_booking_returns_remaining_seats(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    await seed(pool, raw_record("a"), capacity=3)
    response = await client.post("/api/events/a/bookings", json={"email": "x@example.com"})
    assert response.status_code == 201
    assert response.json()["seats_left"] == 2


async def test_sold_out_event_rejects_and_leaves_no_booking(
    pool: AsyncConnectionPool, client: AsyncClient
) -> None:
    await seed(pool, raw_record("a"), capacity=1)
    await client.post("/api/events/a/bookings", json={"email": "first@example.com"})

    response = await client.post("/api/events/a/bookings", json={"email": "late@example.com"})

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "sold_out"
    async with pool.connection() as conn:
        cur = await conn.execute("SELECT count(*) AS n FROM bookings WHERE email = 'late@example.com'")
        row = await cur.fetchone()
    assert row["n"] == 0  # the failed attempt was rolled back completely


async def test_unknown_event_is_404(client: AsyncClient) -> None:
    response = await client.post("/api/events/nope/bookings", json={"email": "x@example.com"})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "event_not_found"


async def test_invalid_email_is_422(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    await seed(pool, raw_record("a"))
    response = await client.post("/api/events/a/bookings", json={"email": "not-an-email"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
