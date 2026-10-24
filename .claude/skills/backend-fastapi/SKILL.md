---
name: backend-fastapi
description: Conventions for the FastAPI backend (layout, uv usage, SQL style, error format, tests). Use before adding or changing any code under backend/.
---

# Backend conventions

## Tooling: uv, not pip
`uv` replaces pip + venv + pip-tools + pyenv. It resolves and installs 10-100x faster, writes a
reproducible `uv.lock`, and installs the right Python for you. `uv sync --frozen` in Docker/CI gives
the exact same versions everywhere.

- Add: `uv add <pkg>` / `uv add --dev <pkg>`. Remove: `uv remove <pkg>`.
- Run: `uv run <cmd>` (no manual venv activation).

## Structure
One folder per feature (`events/`, `bookings/`, `ingest/`). Inside: `router.py` (HTTP only),
`repository.py` or `service.py` (SQL and logic), `schemas.py` (Pydantic). Routers never contain SQL.

## Style
- Async everywhere. One shared `AsyncConnectionPool`, injected via `request.app.state.pool`.
- Raw SQL with `%s` placeholders. Build dynamic `WHERE` clauses by appending SQL fragments and params
  to two lists. Never f-string a value.
- Pure functions for logic that can be pure (`ingest/normalize.py`), so it is trivially testable.
- Type hints on every function. Pydantic models for all request/response bodies.
- Settings only through `config.Settings` (env prefix `SORTIR_`).

## Errors
Return `{"error": {"code": "snake_case", "message": "human text"}}`. Raise `ApiError(status, code, message)`.
Codes used: `event_not_found`, `sold_out`, `already_booked`, `busy`, `validation_error`.

## Tests
- `pytest` + `pytest-asyncio`, real CockroachDB (`docker compose up -d cockroach`).
- Unit tests for pure code, integration tests through `httpx.AsyncClient` + `ASGITransport`.
- Each test starts from empty tables (fixture truncates).

## Gotchas (each one cost time once)
- **CockroachDB is stricter than Postgres about types.** `6371.0` is a DECIMAL, so `DECIMAL * FLOAT8`
  fails. Cast constants explicitly (`6371::FLOAT8`). Test every new SQL expression against the real DB.
- **`ON CONFLICT ON CONSTRAINT` is not supported.** Use `ON CONFLICT (col, col)`.
- **ODSQL (Paris Open Data) rejects `now()+90d`.** Compute dates in Python and pass `date'...'`.
- **Windows:** psycopg async cannot use the default `ProactorEventLoop`. `app/__init__.py` selects the
  selector loop for scripts and tests. For uvicorn use `--reload` (it uses the selector loop).
- **Pool errors are swallowed.** `pool.open(wait=True)` only reports "PoolTimeout". Connect once with
  `psycopg.AsyncConnection.connect` to see the real error.
- **Ordering must be deterministic** (`..., starts_at, id`), or paging can skip or repeat rows.

## Before committing
`uv run ruff check . && uv run ruff format . && uv run pytest`
