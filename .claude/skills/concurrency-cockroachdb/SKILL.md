---
name: concurrency-cockroachdb
description: Rules for the seat-reservation code and CockroachDB transactions. Use before editing backend/app/bookings, backend/app/db.py, schema.sql, or the concurrency tests.
---

# Concurrency with CockroachDB

## The problem
Two users click "Reserve" on the last seat at the same moment. Naive code does
`SELECT seats_taken` → check → `UPDATE`. Both read "1 seat left", both write. Overbooking.

## Our guarantees
- `seats_taken <= capacity` always (also enforced by a `CHECK` constraint as a last safety net).
- One booking per `(event_id, email)` (`UNIQUE` constraint). A double-click books once.
- Exactly `capacity` out of N concurrent requests succeed. The rest get a clean `409 sold_out`.

## How it works (3 layers)
1. **Atomic conditional update**: `UPDATE events SET seats_taken = seats_taken + 1 WHERE id = $1 AND seats_taken < capacity RETURNING ...`.
   The check and the write are one statement. Zero rows returned = sold out. No read-then-write gap.
2. **Serializable isolation** (CockroachDB default). If two transactions conflict, the DB aborts one
   with SQLSTATE `40001`. This is normal, not a bug.
3. **Client-side retry** in `db.run_transaction`: on `40001` we roll back and re-run the *whole*
   transaction with exponential backoff + jitter. Business errors (sold out, already booked) are
   **not** retried.

## Rules when editing
- All multi-statement work goes through `run_transaction(pool, work)`. `work` must be safe to run
  more than once: no side effects outside the DB (no emails, no HTTP calls) inside it.
- Insert the booking row first, then the conditional update. Duplicates fail fast without touching
  the hot `events` row.
- Raise domain exceptions (`SoldOut`, `AlreadyBooked`, `EventNotFound`) inside `work` to roll back.
- Never catch `SerializationFailure` inside `work`. Let it reach `run_transaction`.
- Never `SELECT` then `UPDATE` to check capacity. Never use Python-side locks (they break with >1 API instance).

## Tests that must keep passing
`backend/tests/test_booking_concurrency.py`:
- 50 concurrent requests, capacity 10 → exactly 10 `201`, 40 `409 sold_out`, `seats_taken == 10`.
- 20 concurrent requests, same email → exactly 1 `201`, rest `409 already_booked`.
They run against a real CockroachDB. Mocks would prove nothing here.

## Known limit (roadmap, not a bug)
One very popular event = one hot row = contention and retries. Fix at scale: split the counter into
N shards, or queue reservations. Documented in docs/DECISIONS.md.
