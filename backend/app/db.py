"""Database access: connection pool, schema bootstrap and the transaction retry helper.

CockroachDB runs every transaction at SERIALIZABLE isolation. When two transactions touch the same
rows at the same time, it aborts one with SQLSTATE 40001 and expects the client to run it again.
`run_transaction` does exactly that, so callers just write the business logic.
"""

import asyncio
import logging
import random
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from app.config import settings

log = logging.getLogger("sortir.db")

SCHEMA_PATH = Path(__file__).with_name("schema.sql")

# CockroachDB Cloud: the cluster's CA certificate (downloaded from the Cloud Console, see
# docs/DEPLOIEMENT.md). If the file is there we verify the server against it. It lives inside `app/`
# so it is shipped with the code on Vercel, where there is no ~/.postgresql/root.crt.
CA_CERT_PATH = Path(__file__).parent / "certs" / "cockroach-ca.crt"


def _connect_kwargs() -> dict:
    """Options for every connection. Autocommit lets us control BEGIN/COMMIT explicitly."""
    kwargs: dict = {"autocommit": True, "row_factory": dict_row}
    if CA_CERT_PATH.exists():
        kwargs["sslrootcert"] = str(CA_CERT_PATH)
    return kwargs


# Counts how many times a transaction had to be re-run. Exposed on /api/health so the
# effect of contention is visible during the demo.
tx_retries = 0


class DirectConnections:
    """Opens a fresh connection each time `connection()` is used, and closes it afterwards.

    Same `async with source.connection() as conn` shape as the pool, so the rest of the code does not
    care which one it has. Serverless functions freeze between requests and may resume on a different
    event loop, which breaks a long-lived pool. A short-lived connection per request is always safe.
    The price is one connection handshake per request (tens of milliseconds).
    """

    def __init__(self, url: str) -> None:
        self.url = url

    @asynccontextmanager
    async def connection(self) -> AsyncIterator[psycopg.AsyncConnection]:
        conn = await psycopg.AsyncConnection.connect(self.url, **_connect_kwargs())
        try:
            yield conn
        finally:
            await conn.close()


# Anything that can hand out connections: the pool (default) or DirectConnections (serverless).
type ConnectionSource = AsyncConnectionPool | DirectConnections


def make_pool(url: str | None = None) -> AsyncConnectionPool:
    """Create (but do not open) the pool. Autocommit lets us control BEGIN/COMMIT explicitly."""
    return AsyncConnectionPool(
        url or settings.database_url,
        min_size=settings.pool_min_size,
        max_size=settings.pool_max_size,
        kwargs=_connect_kwargs(),
        open=False,
    )


async def init_schema(pool: ConnectionSource) -> None:
    async with pool.connection() as conn:
        await conn.execute(SCHEMA_PATH.read_text(encoding="utf-8"))


async def run_transaction[T](
    pool: ConnectionSource,
    work: Callable[[psycopg.AsyncConnection], Awaitable[T]],
    *,
    max_attempts: int = 10,
) -> T:
    """Run `work` in a transaction, retrying the whole thing on serialization conflicts.

    `work` may run several times, so it must only touch the database (no emails, no HTTP calls).
    Any other exception (including our own domain errors) rolls back and propagates immediately.
    """
    global tx_retries
    for attempt in range(1, max_attempts + 1):
        try:
            async with pool.connection() as conn:
                async with conn.transaction():
                    return await work(conn)
        except psycopg.errors.SerializationFailure:
            if attempt == max_attempts:
                raise
            tx_retries += 1
            # Exponential backoff with full jitter: spreads competing retries apart in time.
            delay = random.uniform(0, min(0.02 * 2**attempt, 0.5))
            log.debug("serialization conflict, retry %d in %.0f ms", attempt, delay * 1000)
            await asyncio.sleep(delay)
    raise AssertionError("unreachable")
