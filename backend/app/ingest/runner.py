"""Fetch, normalise, upsert. Run with:  uv run python -m app.ingest"""

import logging
from datetime import UTC, datetime
from typing import Any

from app.config import settings
from app.db import ConnectionSource, init_schema, make_pool, run_transaction
from app.ingest.client import fetch_pages, make_client
from app.ingest.normalize import normalize_record

log = logging.getLogger("sortir.ingest")

# On conflict we refresh descriptive fields only. `capacity` and `seats_taken` are NOT in the
# update list: re-ingesting must never reset or alter reservations.
UPSERT_SQL = """
INSERT INTO events (
    id, title, summary, description, category, tags, starts_at, ends_at, when_text,
    venue_name, address, zipcode, arrondissement, lat, lon, price_type, price_detail,
    is_free, cover_url, source_url, capacity, source_updated_at
) VALUES (
    %(id)s, %(title)s, %(summary)s, %(description)s, %(category)s, %(tags)s, %(starts_at)s,
    %(ends_at)s, %(when_text)s, %(venue_name)s, %(address)s, %(zipcode)s, %(arrondissement)s,
    %(lat)s, %(lon)s, %(price_type)s, %(price_detail)s, %(is_free)s, %(cover_url)s,
    %(source_url)s, %(capacity)s, %(source_updated_at)s
)
ON CONFLICT (id) DO UPDATE SET
    title = excluded.title, summary = excluded.summary, description = excluded.description,
    category = excluded.category, tags = excluded.tags, starts_at = excluded.starts_at,
    ends_at = excluded.ends_at, when_text = excluded.when_text, venue_name = excluded.venue_name,
    address = excluded.address, zipcode = excluded.zipcode,
    arrondissement = excluded.arrondissement, lat = excluded.lat, lon = excluded.lon,
    price_type = excluded.price_type, price_detail = excluded.price_detail,
    is_free = excluded.is_free, cover_url = excluded.cover_url, source_url = excluded.source_url,
    source_updated_at = excluded.source_updated_at, ingested_at = now()
"""


async def upsert_events(pool: ConnectionSource, rows: list[dict[str, Any]]) -> None:
    async def work(conn):
        async with conn.cursor() as cur:
            await cur.executemany(UPSERT_SQL, rows)

    await run_transaction(pool, work)


async def ingest(pool: ConnectionSource) -> int:
    """Pull the whole window from the API and upsert it page by page. Returns rows written."""
    total = skipped = 0
    async with make_client() as client:
        async for page in fetch_pages(client, datetime.now(UTC), settings.ingest_window_days):
            rows = [row for raw in page if (row := normalize_record(raw))]
            skipped += len(page) - len(rows)
            if rows:
                await upsert_events(pool, rows)
            total += len(rows)
            log.info("ingested %d events so far", total)
    log.info("done: %d upserted, %d skipped as unusable", total, skipped)
    return total


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)  # one line per page is noise
    pool = make_pool()
    await pool.open(wait=True, timeout=30)
    try:
        await init_schema(pool)
        await ingest(pool)
    finally:
        await pool.close()
