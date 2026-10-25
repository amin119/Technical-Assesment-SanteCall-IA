# Sortir API

Service FastAPI : recherche d'événements, import des données et réservation de places sûre face à la concurrence.
Voir le [README principal](../README.md) et l'[architecture](../docs/ARCHITECTURE.md).

```bash
uv sync                                # installe les dépendances
uv run uvicorn app.main:app --reload   # lance l'API (documentation : http://localhost:8000/docs)
uv run python -m app.ingest            # charge les événements de Paris Data
uv run pytest                          # tests (il faut : docker compose up -d cockroach)
```
