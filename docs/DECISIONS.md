# Decisions

Each entry: what we chose, why, and what we gave up. Short on purpose.

## 1. Database: CockroachDB (not Cassandra)

**Chosen:** CockroachDB.

**Why.** The requirement is that two simultaneous reservations never overbook. That is a *consistency* problem.

- CockroachDB gives **serializable transactions by default**. The database itself guarantees the outcome, and our code only has to retry.
- It speaks **PostgreSQL SQL**, so filtering by date, category, price and distance is one query, and `CHECK`/`UNIQUE` constraints enforce the rules.
- It scales out and survives node loss with the same SQL.

**Why not Cassandra.** Cassandra is built for huge write throughput with eventual consistency.

- Safe inventory needs *lightweight transactions* (Paxos). They work, but they are slow and limited to one partition.
- Cassandra counters cannot say "increment only if below the limit".
- Search needs many filter combinations. Cassandra wants one pre-built table per query shape, so we would duplicate data for every filter.
- Net: it would make the one thing we care about (correct booking) harder, and the thing we do most (flexible search) much harder.

**Cost.** CockroachDB is heavier than Postgres for a small app, and conflicting transactions must be retried (we handle that in one place, `db.run_transaction`).

## 2. Backend: FastAPI (not NestJS)

**Why.** The work is I/O bound (waiting for the database), where Python `async` is fine. FastAPI gives typed request/response validation and an auto-generated OpenAPI page (`/docs`) with very little code. Python also suits the data-cleaning in ingestion.

**Why not NestJS.** A good framework, and the right pick for a team already on TypeScript end to end. For this scope it adds structure (modules, decorators, DI) we do not need.

**Cost.** Two languages in the repo (Python and TypeScript). API types are mirrored by hand in `frontend/src/api/types.ts`. Generating them from OpenAPI is a listed next step.

## 3. Database access: psycopg 3 and raw SQL (no ORM)

**Why.** The most important code in the project is a transaction with a retry. We want it visible on one screen, not hidden behind ORM session behaviour. The queries are few and the SQL is short.

**Cost.** More SQL strings to maintain. No automatic migrations: `schema.sql` is idempotent and runs at start. A migration tool (Alembic or similar) is the next step once the schema changes over time.

## 4. Packaging: uv (not pip)

**Why.** `uv` replaces `pip`, `venv`, `pip-tools` and `pyenv` with one fast tool.

- Installs are 10 to 100 times faster (it is written in Rust, with a global cache).
- `uv.lock` pins every dependency exactly, so your machine, CI and Docker get identical versions. Plain `pip install -r requirements.txt` does not lock transitive dependencies.
- It installs the right Python version for you.
- `uv run` needs no manual virtualenv activation.

**Cost.** Newer than pip, so fewer people know it. The workflow is small (`uv sync`, `uv add`, `uv run`).

## 5. Frontend: React + Vite + TypeScript (not Next.js)

**Why.** A client-side app with no login and no need for search-engine indexing. Vite gives an instant dev server and a plain static build served by nginx. Next.js would add a Node server, routing conventions and rendering modes we would not use.

**Cost.** No server-side rendering, so individual event pages are not indexable. If public SEO becomes a goal, Next.js is the natural migration.

## 6. Frontend building blocks

| Choice | Why | Instead of |
|---|---|---|
| TanStack Query | Caching, request cancellation, retries and "keep the old list while loading" in a few lines | `useEffect` + `fetch` + `useState`, which has subtle bugs (races, stale data) |
| Filters in the URL | Shareable links, working back button, survives refresh | A global store (Redux, Zustand) |
| motion | Layout animations and shared-underline transitions that are hard to hand-write | Hand-written CSS keyframes for everything |
| Leaflet + OpenStreetMap | Free, no API key | Google Maps (key, billing). Mapbox (key) |
| Plain CSS with tokens | Full control of the look. Few dependencies. | Tailwind or a UI kit, which tend to look generic |
| Self-hosted fonts (`@fontsource`) | No third-party request, no tracking, works offline | Google Fonts link |

Note on map tiles: the standard OpenStreetMap tile server is fine for a demo but has a usage policy. Production should use a tile provider or self-hosted tiles. (CARTO's free tiles now require an API key, which we found while testing.)

## 7. Capacity is synthetic

The open data has no seat counts, so each event gets a stable capacity from 20 to 200, derived from a hash of its id. It never changes between imports. Reservations are therefore a **stand-in to demonstrate correct concurrency**, not real ticketing. The UI footer says so.

## 8. HTML from the source is turned into plain text

Descriptions arrive as HTML from a third party. Rendering it in the browser invites cross-site-scripting. We strip it at ingestion and keep paragraph breaks, so the frontend never renders untrusted HTML.

## 9. Ingestion is a separate one-shot job

It is not part of the API process. API restarts never trigger a heavy import, a failed import never affects requests, and the same command works locally, in Docker and from a scheduler.

## 10. What we deliberately skipped

| Skipped | Why |
|---|---|
| Authentication and accounts | Out of scope for the time box. Email-only reservations are called out as a limit. |
| Cancelling a reservation | Simple to add (delete the row, decrement in one transaction). Not needed to prove the point. |
| Email confirmation | Needs an email provider. The retry-safe transaction is already designed so sending would happen **after** commit. |
| Scheduled re-ingestion | One command today. A cron or CI schedule is a one-line addition. |
| End-to-end browser tests | Backend and logic are covered. A Playwright test of the booking flow is the next test to add. |
