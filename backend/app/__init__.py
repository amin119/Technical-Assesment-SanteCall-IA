import asyncio
import sys

# psycopg's async mode cannot run on Windows' default ProactorEventLoop. Switch to the selector
# loop before anything creates an event loop. Linux/macOS/Docker are unaffected.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
