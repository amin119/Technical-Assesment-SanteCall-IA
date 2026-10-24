import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.bookings.router import router as bookings_router
from app.config import settings
from app.errors import register_error_handlers
from app.events.router import router as events_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    pool = db.make_pool()
    await pool.open(wait=True, timeout=30)
    await db.init_schema(pool)
    app.state.pool = pool
    yield
    await pool.close()


app = FastAPI(title="Sortir API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"]
)
register_error_handlers(app)
app.include_router(events_router)
app.include_router(bookings_router)


@app.get("/api/health", tags=["meta"])
async def health() -> dict:
    async with app.state.pool.connection() as conn:
        await conn.execute("SELECT 1")
    # tx_retries = how many times a transaction was re-run after a serialization conflict.
    return {"status": "ok", "tx_retries": db.tx_retries}
