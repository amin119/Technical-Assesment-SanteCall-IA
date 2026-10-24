"""Paged HTTP client for the Paris Open Data "Que faire à Paris" dataset."""

from collections.abc import AsyncIterator
from datetime import datetime, timedelta

import httpx

URL = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records"
PAGE_SIZE = 100  # API maximum per request
MAX_WINDOW = 10_000  # API refuses offset + limit above this


def build_where(now: datetime, window_days: int) -> str:
    """Events still running now and starting within the window (ODSQL syntax)."""
    fmt = "%Y-%m-%dT%H:%M:%SZ"
    horizon = now + timedelta(days=window_days)
    return f"date_end >= date'{now.strftime(fmt)}' and date_start <= date'{horizon.strftime(fmt)}'"


def make_client() -> httpx.AsyncClient:
    # `retries` retries connection errors only; good enough for a public read-only API.
    return httpx.AsyncClient(timeout=30, transport=httpx.AsyncHTTPTransport(retries=3))


async def fetch_pages(
    client: httpx.AsyncClient, now: datetime, window_days: int
) -> AsyncIterator[list[dict]]:
    """Yield raw records, one page at a time, so memory stays flat."""
    where = build_where(now, window_days)
    offset = 0
    while offset + PAGE_SIZE <= MAX_WINDOW:
        response = await client.get(
            URL,
            params={"where": where, "order_by": "date_start,id", "limit": PAGE_SIZE, "offset": offset},
        )
        response.raise_for_status()
        payload = response.json()
        results = payload["results"]
        if not results:
            return
        yield results
        offset += len(results)
        if offset >= payload["total_count"]:
            return
