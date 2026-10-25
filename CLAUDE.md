# Sortir — Paris events finder

Web app to find cultural and leisure events in Paris (concerts, theatre, exhibitions, sport...).
Technical assessment project. Real data comes from the Paris Open Data "Que faire à Paris" feed.
Users can **reserve a seat**; two people reserving the last seat at the same instant must never
both succeed. That is the technical heart of the project.

## Stack (and the one-line reason for each)

| Layer      | Choice                       | Why |
|------------|------------------------------|-----|
| Database   | CockroachDB                  | SQL + serializable transactions by default, so concurrency bugs are caught by the DB, not hoped away. Cassandra was rejected (see docs/DECISIONS.md). |
| Backend    | FastAPI (Python 3.12, async) | Fast to write, typed, auto OpenAPI docs, great for IO-bound APIs. |
| DB driver  | psycopg 3 + raw SQL          | The concurrency logic must be visible. No ORM hiding transactions. |
| Packaging  | uv                           | One tool for Python versions, venv, lockfile. 10-100x faster than pip. |
| Frontend   | React + Vite + TypeScript    | A SPA is enough (no SEO need). Simple, fast dev loop. |
| Data fetch | TanStack Query               | Caching, dedupe, cancellation, retries without hand-written effects. |
| Animation  | motion (framer-motion)       | Layout animations and shared-element transitions. |
| Look       | Plain CSS tokens, Plus Jakarta Sans + Newsreader | Design from Google Stitch, rebuilt as reusable components. No CSS framework. |
| Languages  | own typed FR/EN layer        | ~100 strings, two languages. Missing keys fail the build. |
| Map        | Leaflet + OpenStreetMap      | Free, no API key (tiles muted with a CSS filter). |
| Deploy     | Docker Compose, GitHub Actions | `docker compose up` runs everything. |

## Commands

```bash
docker compose up --build            # whole stack: db + api + ingest + web  → http://localhost:8080
docker compose up -d cockroach       # only the database (for local dev and tests)

cd backend
uv sync                              # install deps from uv.lock
uv run uvicorn app.main:app --reload # API on :8000 (docs at /docs)
uv run python -m app.ingest          # pull events from Paris Open Data into the DB
uv run pytest                        # tests (needs CockroachDB on :26257)
uv run ruff check . && uv run ruff format --check .
uv run python -m app.demo.race       # live demo of the concurrency guarantee

cd frontend
npm install
npm run dev                          # :5173, proxies /api to :8000
npm run lint && npm run typecheck && npm test && npm run build
```

## Deploy (Vercel)

One Vercel project at the repo root: `vercel.json` builds `frontend/` to static files and serves FastAPI from
`api/index.py` under `/api/*` (short-lived DB connections, `SORTIR_POOL_MODE=direct`). Database: CockroachDB Cloud.
Guide (French): `docs/DEPLOIEMENT.md`. `requirements.txt` at the root is generated: refresh it with
`uv export --project backend --frozen --no-dev --no-hashes --no-emit-project -o requirements.txt` after `uv add`.

## Layout

```
backend/app/        main.py, config.py, db.py (pool + retry), schema.sql
  events/           router, repository (SQL), schemas
  bookings/         router, service (the concurrency-critical code)
  ingest/           client (HTTP), normalize (pure functions), runner (upsert)
  demo/race.py      concurrency demo
backend/tests/
frontend/src/       api/, components/ (ui, layout, filters, events, drawer, map), hooks/, i18n/, lib/, styles/
docs/               ARCHITECTURE.md, DECISIONS.md
.claude/skills/     project rules (read the relevant one before editing)
```

## Skills (read the relevant one before editing)

| Skill | Use it when |
|-------|-------------|
| `system-design` | adding a service, table, job, cache, or changing how parts connect. Also when updating `docs/ARCHITECTURE.md`. |
| `concurrency-cockroachdb` | touching `bookings/`, `db.py`, `schema.sql` or the concurrency tests |
| `backend-fastapi` | any change under `backend/` (includes gotchas) |
| `frontend-react` | any change under `frontend/` (includes gotchas) |
| `design-system` | any CSS, markup or animation |
| `git-and-docs` | committing, CI, README and docs |

## Golden rules

1. **Never break the booking invariant**: `seats_taken <= capacity`, one booking per (event, email).
   Read `.claude/skills/concurrency-cockroachdb/SKILL.md` before touching `bookings/` or `db.py`.
2. Use `uv`, never `pip`. Add deps with `uv add`, never edit `uv.lock` by hand.
3. Raw parameterised SQL only. Never format values into SQL strings.
4. Never render third-party HTML. Ingestion converts HTML to plain text.
5. UI follows `.claude/skills/design-system/SKILL.md`. No new colors/fonts outside the tokens. Reuse the `components/ui` primitives.
   All user-facing text goes through `src/i18n/messages.ts` in French **and** English. No hard-coded strings.
6. Every behaviour change ships with a test. Concurrency tests run against a real CockroachDB, never mocks.
7. Docs are for a newcomer: short sentences, say *why*, no jargon without a definition. Project docs are in French;
   code, comments, commits and skills stay in English.
8. Small commits, imperative messages (`Add ...`, `Fix ...`). Run lint + tests first.
9. Verify against the real thing: real CockroachDB for SQL, a real browser for UI. Passing types and
   mocks is not proof. Never claim a number that was not measured.
10. Structural changes update `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` in the same commit.

## Honest limits (say these out loud in the interview)

- Seat capacity is **synthetic** (derived from the event id) because the open data has no capacity.
  Reservations are a realistic stand-in to demonstrate correct concurrency, not real ticketing.
- No authentication: a reservation is identified by email only.
