from datetime import datetime
from typing import Annotated
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel, EmailStr

from app.bookings import service
from app.errors import ApiError
from app.events.router import get_pool

router = APIRouter(prefix="/api", tags=["bookings"])


class BookingIn(BaseModel):
    email: EmailStr


class BookingOut(BaseModel):
    id: UUID
    event_id: str
    email: str
    created_at: datetime
    seats_left: int


@router.post("/events/{event_id}/bookings", response_model=BookingOut, status_code=201)
async def create_booking(
    event_id: str,
    body: BookingIn,
    pool: Annotated[AsyncConnectionPool, Depends(get_pool)],
) -> BookingOut:
    try:
        booking = await service.reserve_seat(pool, event_id, body.email)
    except service.EventNotFound:
        raise ApiError(404, "event_not_found", "This event does not exist.") from None
    except service.SoldOut:
        raise ApiError(409, "sold_out", "Sorry, this event is sold out.") from None
    except service.AlreadyBooked:
        raise ApiError(409, "already_booked", "You already have a seat for this event.") from None
    except psycopg.errors.SerializationFailure:
        # Retries exhausted under extreme contention. Tell the client to try again shortly.
        raise ApiError(
            503, "busy", "Many people are booking right now. Please try again.", {"Retry-After": "1"}
        ) from None
    return BookingOut(**booking)
