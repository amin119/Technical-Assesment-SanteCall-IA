# Sortir API

FastAPI service: event search, data ingestion and concurrency-safe seat reservations.
See the [root README](../README.md) and [architecture](../docs/ARCHITECTURE.md).

```bash
uv sync                                # install
uv run uvicorn app.main:app --reload   # run (docs: http://localhost:8000/docs)
uv run python -m app.ingest            # load events from Paris Open Data
uv run pytest                          # test (needs: docker compose up -d cockroach)
```
