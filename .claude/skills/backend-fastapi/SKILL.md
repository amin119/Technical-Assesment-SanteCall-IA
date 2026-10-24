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

## Before committing
`uv run ruff check . && uv run ruff format . && uv run pytest`
