import type { Booking, CategoryCount, EventDetail, EventList, GeoPoint } from './types'

/** An error returned by the API: {"error": {"code", "message"}}. `code` is stable, `message` is not. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let code = 'unknown'
    let message = 'Une erreur est survenue.'
    try {
      const body = await response.json()
      code = body.error.code
      message = body.error.message
    } catch {
      // Not our JSON error shape (e.g. a proxy error page): keep the generic message.
    }
    throw new ApiError(response.status, code, message)
  }
  return response.json() as Promise<T>
}

export const api = {
  events: (params: URLSearchParams, signal?: AbortSignal) =>
    request<EventList>(`/api/events?${params}`, { signal }),
  geo: (params: URLSearchParams, signal?: AbortSignal) =>
    request<GeoPoint[]>(`/api/events/geo?${params}`, { signal }),
  categories: (params: URLSearchParams, signal?: AbortSignal) =>
    request<CategoryCount[]>(`/api/categories?${params}`, { signal }),
  event: (id: string, signal?: AbortSignal) =>
    request<EventDetail>(`/api/events/${encodeURIComponent(id)}`, { signal }),
  book: (id: string, email: string) =>
    request<Booking>(`/api/events/${encodeURIComponent(id)}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
}
