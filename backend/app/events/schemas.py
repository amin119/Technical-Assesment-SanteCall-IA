from datetime import datetime

from pydantic import BaseModel, computed_field

from app.ingest.normalize import CATEGORY_LABELS


class EventSummary(BaseModel):
    id: str
    title: str
    summary: str
    category: str
    starts_at: datetime
    ends_at: datetime
    when_text: str
    venue_name: str | None
    arrondissement: int | None
    lat: float | None
    lon: float | None
    is_free: bool
    price_type: str
    cover_url: str | None
    capacity: int
    seats_taken: int
    distance_km: float | None = None

    @computed_field
    @property
    def category_label(self) -> str:
        return CATEGORY_LABELS.get(self.category, self.category)

    @computed_field
    @property
    def seats_left(self) -> int:
        return self.capacity - self.seats_taken


class EventDetail(EventSummary):
    description: str
    address: str | None
    zipcode: str | None
    price_detail: str
    source_url: str | None
    tags: list[str]


class EventList(BaseModel):
    items: list[EventSummary]
    total: int
    limit: int
    offset: int


class GeoPoint(BaseModel):
    id: str
    title: str
    category: str
    lat: float
    lon: float


class CategoryCount(BaseModel):
    slug: str
    label: str
    count: int
