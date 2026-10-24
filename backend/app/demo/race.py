"""Live demo of the concurrency guarantee.   uv run python -m app.demo.race

Creates a 10-seat event, then fires 100 reservation requests at the running API at the same time.
Expected: exactly 10 succeed, 90 get "sold_out", and the database agrees.
"""

import asyncio
import sys
import time
from collections import Counter
from datetime import UTC, datetime, timedelta

import httpx

from app.db import init_schema, make_pool
from app.ingest.normalize import normalize_record
from app.ingest.runner import upsert_events

API = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
SEATS, BUYERS = 10, 100


async def main() -> None:
    pool = make_pool()
    await pool.open(wait=True, timeout=30)
    await init_schema(pool)

    event_id = f"demo-race-{int(time.time())}"
    start = datetime.now(UTC) + timedelta(days=1)
    row = normalize_record(
        {
            "id": event_id,
            "title": "Démo : les dix dernières places",
            "date_start": start.isoformat(),
            "date_end": (start + timedelta(hours=2)).isoformat(),
            "qfap_tags": "Concert",
            "price_type": "gratuit",
            "address_name": "Salle de démonstration",
            "address_zipcode": "75011",
            "lat_lon": {"lat": 48.8566, "lon": 2.3522},
        }
    )
    assert row is not None
    row["capacity"] = SEATS
    await upsert_events(pool, [row])

    async with httpx.AsyncClient(base_url=API, timeout=60) as client:
        retries_before = (await client.get("/api/health")).json()["tx_retries"]
        print(f"Event '{event_id}' has {SEATS} seats. {BUYERS} people click 'Reserve' at the same instant...")

        started = time.perf_counter()
        responses = await asyncio.gather(
            *[
                client.post(f"/api/events/{event_id}/bookings", json={"email": f"fan{i}@example.com"})
                for i in range(BUYERS)
            ]
        )
        elapsed = time.perf_counter() - started
        retries_after = (await client.get("/api/health")).json()["tx_retries"]

    outcome = Counter("booked" if r.status_code == 201 else r.json()["error"]["code"] for r in responses)
    async with pool.connection() as conn:
        cur = await conn.execute(
            "SELECT e.seats_taken, (SELECT count(*) FROM bookings WHERE event_id = e.id) AS rows "
            "FROM events e WHERE e.id = %s",
            (event_id,),
        )
        db = await cur.fetchone()
    await pool.close()

    print(f"\n  answered in {elapsed:.2f}s: {dict(outcome)}")
    print(f"  database: seats_taken={db['seats_taken']}, booking rows={db['rows']} (capacity {SEATS})")
    print(f"  serialization conflicts retried by the server: {retries_after - retries_before}")
    ok = outcome["booked"] == SEATS and db["seats_taken"] == SEATS and db["rows"] == SEATS
    print("\n  RESULT:", "no overbooking" if ok else "OVERBOOKED, this is a bug")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    asyncio.run(main())
