"""Vercel entry point: exposes the FastAPI app as a serverless function.

Vercel serves everything under /api through this file (see vercel.json). The real code lives in
backend/app, so we add `backend/` to the import path and switch to short-lived connections.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
os.environ.setdefault("SORTIR_POOL_MODE", "direct")

from app.main import app  # noqa: E402  (must come after the path and environment setup)

__all__ = ["app"]
