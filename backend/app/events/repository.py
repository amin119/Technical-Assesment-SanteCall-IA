"""All SQL for reading events. Values are always passed as parameters, never formatted in."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.db import ConnectionSource

LIST_COLUMNS = """
    id, title, summary, category, starts_at, ends_at, when_text, venue_name, arrondissement,
    lat, lon, is_free, price_type, cover_url, capacity, seats_taken
"""

# Great-circle distance in km (haversine). Contains only named placeholders, no user text.
DISTANCE_SQL = """(6371::FLOAT8 * 2::FLOAT8 * asin(sqrt(
    power(sin(radians(lat - %(near_lat)s::FLOAT8) / 2::FLOAT8), 2::FLOAT8) +
    cos(radians(%(near_lat)s::FLOAT8)) * cos(radians(lat)) *
    power(sin(radians(lon - %(near_lon)s::FLOAT8) / 2::FLOAT8), 2::FLOAT8)
)))"""

# What people want first is "what starts soon". Ranking, most important first:
#   1. short events before long-running programmes ("Du 1er janvier au 31 décembre")
#   2. events starting inside the window before ones that were already running when it opened
#   3. soonest start first
# Uses the same %(date_from)s parameter as the WHERE clause (NULL means "now").
DATE_ORDER = """
    (ends_at - starts_at > INTERVAL '14 days'),
    (starts_at < COALESCE(%(date_from)s, now())),
    starts_at, id
"""


@dataclass
class EventFilters:
    q: str | None = None
    categories: list[str] = field(default_factory=list)
    date_from: datetime | None = None  # default: now (hide finished events)
    date_to: datetime | None = None
    free: bool | None = None
    arrondissement: int | None = None
    available_only: bool = False
    near: tuple[float, float, float] | None = None  # lat, lon, radius_km


def _escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def build_where(f: EventFilters, *, include_categories: bool = True) -> tuple[str, dict[str, Any]]:
    # An event is shown if it overlaps [date_from, date_to]. This keeps long-running
    # exhibitions visible on every day they are open.
    clauses = ["ends_at >= COALESCE(%(date_from)s, now())"]
    params: dict[str, Any] = {"date_from": f.date_from}

    if f.date_to:
        clauses.append("starts_at <= %(date_to)s")
        params["date_to"] = f.date_to
    if f.q:
        clauses.append("(title ILIKE %(q)s OR summary ILIKE %(q)s OR venue_name ILIKE %(q)s)")
        params["q"] = f"%{_escape_like(f.q.strip())}%"
    if include_categories and f.categories:
        clauses.append("category = ANY(%(categories)s)")
        params["categories"] = f.categories
    if f.free is not None:
        clauses.append("is_free = %(free)s")
        params["free"] = f.free
    if f.arrondissement is not None:
        clauses.append("arrondissement = %(arrondissement)s")
        params["arrondissement"] = f.arrondissement
    if f.available_only:
        clauses.append("seats_taken < capacity")
    if f.near:
        lat, lon, radius_km = f.near
        clauses.append(f"lat IS NOT NULL AND lon IS NOT NULL AND {DISTANCE_SQL} <= %(radius_km)s")
        params.update(near_lat=lat, near_lon=lon, radius_km=radius_km)

    return " AND ".join(clauses), params


async def list_events(
    pool: ConnectionSource, f: EventFilters, *, sort: str, limit: int, offset: int
) -> tuple[list[dict], int]:
    where, params = build_where(f)
    distance_col = f", {DISTANCE_SQL} AS distance_km" if f.near else ""
    order = "distance_km, starts_at, id" if sort == "distance" and f.near else DATE_ORDER
    sql = f"""
        SELECT {LIST_COLUMNS}{distance_col}, count(*) OVER () AS total_count
        FROM events WHERE {where}
        ORDER BY {order}
        LIMIT %(limit)s OFFSET %(offset)s
    """
    params.update(limit=limit, offset=offset)
    async with pool.connection() as conn:
        rows = await (await conn.execute(sql, params)).fetchall()
    total = rows[0]["total_count"] if rows else 0
    return rows, total


async def get_event(pool: ConnectionSource, event_id: str) -> dict | None:
    async with pool.connection() as conn:
        cur = await conn.execute(
            f"SELECT {LIST_COLUMNS}, description, address, zipcode, price_detail, source_url, tags "
            "FROM events WHERE id = %s",
            (event_id,),
        )
        return await cur.fetchone()


async def category_counts(pool: ConnectionSource, f: EventFilters) -> list[dict]:
    """Counts per category under the current filters, ignoring the category filter itself,
    so the filter bar can show what each choice would return."""
    where, params = build_where(f, include_categories=False)
    async with pool.connection() as conn:
        cur = await conn.execute(
            f"SELECT category AS slug, count(*) AS count FROM events WHERE {where} "
            "GROUP BY category ORDER BY count DESC",
            params,
        )
        return await cur.fetchall()


async def geo_points(pool: ConnectionSource, f: EventFilters, *, limit: int) -> list[dict]:
    where, params = build_where(f)
    params["limit"] = limit
    async with pool.connection() as conn:
        cur = await conn.execute(
            f"SELECT id, title, category, lat, lon FROM events "
            f"WHERE {where} AND lat IS NOT NULL AND lon IS NOT NULL "
            "ORDER BY starts_at, id LIMIT %(limit)s",
            params,
        )
        return await cur.fetchall()
