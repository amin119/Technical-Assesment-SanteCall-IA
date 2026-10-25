from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Request

from app.db import ConnectionSource
from app.errors import ApiError
from app.events import repository
from app.events.repository import EventFilters
from app.events.schemas import (
    CategoryCount,
    EventDetail,
    EventList,
    EventSummary,
    GeoPoint,
)
from app.ingest.normalize import CATEGORY_LABELS

router = APIRouter(prefix="/api", tags=["events"])


def get_pool(request: Request) -> ConnectionSource:
    return request.app.state.pool


Pool = Annotated[ConnectionSource, Depends(get_pool)]


def get_filters(
    q: Annotated[str | None, Query(max_length=100, description="Text search")] = None,
    category: Annotated[list[str], Query(description="Repeat to select several")] = [],  # noqa: B006
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    free: bool | None = None,
    arrondissement: Annotated[int | None, Query(ge=1, le=20)] = None,
    available_only: bool = False,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lon: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radius_km: Annotated[float | None, Query(gt=0, le=50)] = None,
) -> EventFilters:
    near = None
    if any(v is not None for v in (lat, lon, radius_km)):
        if None in (lat, lon, radius_km):
            raise ApiError(422, "validation_error", "lat, lon and radius_km must be given together")
        near = (lat, lon, radius_km)
    unknown = [c for c in category if c not in CATEGORY_LABELS]
    if unknown:
        raise ApiError(422, "validation_error", f"unknown category: {unknown[0]}")
    return EventFilters(
        q=q or None,
        categories=category,
        date_from=date_from,
        date_to=date_to,
        free=free,
        arrondissement=arrondissement,
        available_only=available_only,
        near=near,
    )


Filters = Annotated[EventFilters, Depends(get_filters)]


@router.get("/events", response_model=EventList)
async def list_events(
    pool: Pool,
    filters: Filters,
    sort: Literal["date", "distance"] = "date",
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> EventList:
    rows, total = await repository.list_events(pool, filters, sort=sort, limit=limit, offset=offset)
    return EventList(
        items=[EventSummary.model_validate(r) for r in rows], total=total, limit=limit, offset=offset
    )


@router.get("/events/geo", response_model=list[GeoPoint])
async def event_points(pool: Pool, filters: Filters) -> list[GeoPoint]:
    """Lightweight points for the map: same filters, no text fields."""
    return [GeoPoint.model_validate(r) for r in await repository.geo_points(pool, filters, limit=2000)]


@router.get("/events/{event_id}", response_model=EventDetail)
async def get_event(pool: Pool, event_id: str) -> EventDetail:
    row = await repository.get_event(pool, event_id)
    if row is None:
        raise ApiError(404, "event_not_found", "This event does not exist.")
    return EventDetail.model_validate(row)


@router.get("/categories", response_model=list[CategoryCount])
async def list_categories(pool: Pool, filters: Filters) -> list[CategoryCount]:
    counts = {r["slug"]: r["count"] for r in await repository.category_counts(pool, filters)}
    # Stable display order from CATEGORY_LABELS; empty categories are kept with count 0.
    return [
        CategoryCount(slug=s, label=label, count=counts.get(s, 0)) for s, label in CATEGORY_LABELS.items()
    ]
