from datetime import UTC, datetime, timedelta

from httpx import AsyncClient
from psycopg_pool import AsyncConnectionPool

from tests.conftest import raw_record, seed


def _at(days: float, hours: float = 2) -> dict:
    start = datetime.now(UTC) + timedelta(days=days)
    return {"date_start": start.isoformat(), "date_end": (start + timedelta(hours=hours)).isoformat()}


async def _ids(client: AsyncClient, **params) -> list[str]:
    response = await client.get("/api/events", params=params)
    assert response.status_code == 200, response.text
    return [e["id"] for e in response.json()["items"]]


async def test_finished_events_are_hidden(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    await seed(pool, raw_record("future", **_at(1)), raw_record("past", **_at(-3)))
    assert await _ids(client) == ["future"]


async def test_events_sorted_soonest_first_with_long_programmes_last(
    pool: AsyncConnectionPool, client: AsyncClient
) -> None:
    await seed(
        pool,
        raw_record("later", **_at(5)),
        raw_record("soon", **_at(1)),
        raw_record("year-long", **_at(-30, hours=24 * 300)),
    )
    assert await _ids(client) == ["soon", "later", "year-long"]


async def test_filter_by_category_and_counts_ignore_the_category_filter(
    pool: AsyncConnectionPool, client: AsyncClient
) -> None:
    await seed(
        pool,
        raw_record("c1", qfap_tags="Concert"),
        raw_record("c2", qfap_tags="Concert"),
        raw_record("t1", qfap_tags="Théâtre"),
    )
    assert sorted(await _ids(client, category="concert")) == ["c1", "c2"]
    assert sorted(await _ids(client, category=["concert", "theatre"])) == ["c1", "c2", "t1"]

    counts = {c["slug"]: c["count"] for c in (await client.get("/api/categories?category=concert")).json()}
    assert counts["concert"] == 2 and counts["theatre"] == 1  # theatre count still shown


async def test_text_search_is_case_insensitive_and_escapes_wildcards(
    pool: AsyncConnectionPool, client: AsyncClient
) -> None:
    await seed(
        pool,
        raw_record("a", title="Soirée Jazz à Bastille"),
        raw_record("b", title="100% Rock"),
        raw_record("c", title="Opéra"),
    )
    assert await _ids(client, q="jazz") == ["a"]
    assert await _ids(client, q="100%") == ["b"]  # '%' is a literal, not "match everything"
    assert await _ids(client, q="%") == ["b"]


async def test_free_and_date_range_filters(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    await seed(
        pool,
        raw_record("free-soon", price_type="gratuit", **_at(1)),
        raw_record("paid-soon", **_at(1)),
        raw_record("free-later", price_type="gratuit", **_at(10)),
    )
    assert sorted(await _ids(client, free="true")) == ["free-later", "free-soon"]
    cutoff = (datetime.now(UTC) + timedelta(days=3)).isoformat()
    assert sorted(await _ids(client, date_to=cutoff)) == ["free-soon", "paid-soon"]


async def test_long_exhibition_matches_any_day_it_is_open(
    pool: AsyncConnectionPool, client: AsyncClient
) -> None:
    await seed(pool, raw_record("expo", qfap_tags="Expo", **_at(-10, hours=24 * 60)))
    day = datetime.now(UTC) + timedelta(days=20)
    window = {"date_from": day.isoformat(), "date_to": (day + timedelta(hours=5)).isoformat()}
    assert await _ids(client, **window) == ["expo"]


async def test_nearby_filter_returns_distance_and_sorts_by_it(
    pool: AsyncConnectionPool, client: AsyncClient
) -> None:
    await seed(
        pool,
        raw_record("bastille", lat_lon={"lat": 48.8532, "lon": 2.3692}),
        raw_record("louvre", lat_lon={"lat": 48.8606, "lon": 2.3376}),
        raw_record("lyon", lat_lon={"lat": 45.76, "lon": 4.83}),
    )
    # Reference point: Hôtel de Ville, Paris
    params = {"lat": 48.8566, "lon": 2.3522, "radius_km": 5, "sort": "distance"}
    response = await client.get("/api/events", params=params)
    items = response.json()["items"]
    assert [e["id"] for e in items] == ["louvre", "bastille"]  # lyon is out of range
    assert 0 < items[0]["distance_km"] < items[1]["distance_km"] < 5


async def test_pagination_reports_total(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    await seed(pool, *[raw_record(str(i), **_at(1 + i / 10)) for i in range(5)])
    body = (await client.get("/api/events", params={"limit": 2, "offset": 2})).json()
    assert body["total"] == 5 and len(body["items"]) == 2


async def test_geo_endpoint_and_detail(pool: AsyncConnectionPool, client: AsyncClient) -> None:
    await seed(pool, raw_record("a"))
    points = (await client.get("/api/events/geo")).json()
    assert points == [{"id": "a", "title": "Event a", "category": "concert", "lat": 48.8823, "lon": 2.3402}]
    detail = (await client.get("/api/events/a")).json()
    assert detail["description"] == "Détails." and detail["seats_left"] == detail["capacity"]
    assert (await client.get("/api/events/missing")).status_code == 404


async def test_bad_parameters_are_rejected(client: AsyncClient) -> None:
    assert (await client.get("/api/events?category=nope")).status_code == 422
    assert (await client.get("/api/events?lat=48.8")).status_code == 422  # lat without lon/radius
    assert (await client.get("/api/events?limit=1000")).status_code == 422
