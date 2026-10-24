-- Idempotent: safe to run on every startup.

CREATE TABLE IF NOT EXISTS events (
    id                STRING PRIMARY KEY,           -- id from Paris Open Data
    title             STRING NOT NULL,
    summary           STRING NOT NULL DEFAULT '',
    description       STRING NOT NULL DEFAULT '',   -- plain text (HTML stripped at ingestion)
    category          STRING NOT NULL,              -- our normalised category
    tags              STRING[] NOT NULL DEFAULT ARRAY[]:::STRING[],
    starts_at         TIMESTAMPTZ NOT NULL,
    ends_at           TIMESTAMPTZ NOT NULL,
    when_text         STRING NOT NULL DEFAULT '',   -- human schedule, e.g. "Le samedi de 18h à 20h"
    venue_name        STRING,
    address           STRING,
    zipcode           STRING,
    arrondissement    INT,
    lat               FLOAT8,
    lon               FLOAT8,
    price_type        STRING NOT NULL DEFAULT '',
    price_detail      STRING NOT NULL DEFAULT '',
    is_free           BOOL NOT NULL DEFAULT false,
    cover_url         STRING,
    source_url        STRING,
    -- Reservation counters. capacity is synthetic (see docs/DECISIONS.md).
    capacity          INT NOT NULL,
    seats_taken       INT NOT NULL DEFAULT 0,
    source_updated_at TIMESTAMPTZ,
    ingested_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Last line of defence against overbooking, even if application code is wrong.
    CONSTRAINT seats_within_capacity CHECK (capacity > 0 AND seats_taken >= 0 AND seats_taken <= capacity),
    INDEX events_starts_idx (starts_at),
    INDEX events_category_starts_idx (category, starts_at)
);

CREATE TABLE IF NOT EXISTS bookings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   STRING NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    email      STRING NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- One seat per person per event: makes a double-click harmless.
    CONSTRAINT one_booking_per_person UNIQUE (event_id, email)
);
