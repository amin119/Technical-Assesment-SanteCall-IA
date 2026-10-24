// Mirrors backend/app/events/schemas.py and backend/app/bookings/router.py.

export interface EventSummary {
  id: string
  title: string
  summary: string
  category: string
  category_label: string
  starts_at: string
  ends_at: string
  when_text: string
  venue_name: string | null
  arrondissement: number | null
  lat: number | null
  lon: number | null
  is_free: boolean
  price_type: string
  cover_url: string | null
  capacity: number
  seats_taken: number
  seats_left: number
  distance_km: number | null
}

export interface EventDetail extends EventSummary {
  description: string
  address: string | null
  zipcode: string | null
  price_detail: string
  source_url: string | null
  tags: string[]
}

export interface EventList {
  items: EventSummary[]
  total: number
  limit: number
  offset: number
}

export interface GeoPoint {
  id: string
  title: string
  category: string
  lat: number
  lon: number
}

export interface CategoryCount {
  slug: string
  label: string
  count: number
}

export interface Booking {
  id: string
  event_id: string
  email: string
  created_at: string
  seats_left: number
}
