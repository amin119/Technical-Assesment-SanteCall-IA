// Filter state <-> URL <-> API query. Pure functions, so they are easy to test.

export type When = 'all' | 'today' | 'tomorrow' | 'weekend' | 'week'

// Labels live in i18n/messages.ts (`when.<value>` and `when.<value>.phrase`).
export const WHEN_VALUES: When[] = ['all', 'today', 'tomorrow', 'weekend', 'week']

export interface Filters {
  q: string
  when: When
  categories: string[]
  free: boolean
  near: { lat: number; lon: number } | null
  /** 1-based page of results. Not sent to the API as a filter: it becomes `offset`. */
  page: number
}

export const DEFAULT_FILTERS: Filters = { q: '', when: 'all', categories: [], free: false, near: null, page: 1 }

export const NEAR_RADIUS_KM = 3

const WHENS = new Set<string>(WHEN_VALUES)

/** `?page=` as a whole number of at least 1. Anything else means page 1. */
function parsePage(raw: string | null): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

/** Read the page URL. Unknown or malformed values fall back to defaults instead of throwing. */
export function parseSearch(search: string): { filters: Filters; eventId: string | null } {
  const p = new URLSearchParams(search)
  const when = p.get('when') ?? 'all'
  const [lat, lon] = (p.get('near') ?? '').split(',').map(Number)
  const near = Number.isFinite(lat) && Number.isFinite(lon) && p.get('near') ? { lat, lon } : null
  return {
    filters: {
      q: p.get('q') ?? '',
      when: WHENS.has(when) ? (when as When) : 'all',
      categories: p.getAll('category'),
      free: p.get('free') === '1',
      near,
      page: parsePage(p.get('page')),
    },
    eventId: p.get('event'),
  }
}

/** Build the page URL query. Defaults are omitted so the URL stays short and readable. */
export function toSearch(filters: Filters, eventId: string | null): string {
  const p = new URLSearchParams()
  if (filters.q) p.set('q', filters.q)
  if (filters.when !== 'all') p.set('when', filters.when)
  filters.categories.forEach((c) => p.append('category', c))
  if (filters.free) p.set('free', '1')
  if (filters.near) p.set('near', `${filters.near.lat.toFixed(4)},${filters.near.lon.toFixed(4)}`)
  if (filters.page > 1) p.set('page', String(filters.page))
  if (eventId) p.set('event', eventId)
  const s = p.toString()
  return s ? `?${s}` : ''
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes())

/** The [from, to] window for a quick-date choice. `from` never goes before `now`. */
export function whenToRange(when: When, now: Date = new Date()): { from?: Date; to?: Date } {
  switch (when) {
    case 'today':
      return { from: now, to: endOfDay(now) }
    case 'tomorrow': {
      const t = addDays(now, 1)
      return { from: startOfDay(t), to: endOfDay(t) }
    }
    case 'weekend': {
      const dow = now.getDay() // 0 = Sunday ... 6 = Saturday
      if (dow === 0) return { from: now, to: endOfDay(now) }
      if (dow === 6) return { from: now, to: endOfDay(addDays(now, 1)) }
      const saturday = addDays(now, 6 - dow)
      return { from: startOfDay(saturday), to: endOfDay(addDays(saturday, 1)) }
    }
    case 'week':
      return { from: now, to: endOfDay(addDays(now, 6)) }
    default:
      return {}
  }
}

/** Query string for the backend. `includeCategories: false` is used for the category counts. */
export function toApiParams(filters: Filters, now: Date = new Date(), includeCategories = true): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.q) p.set('q', filters.q)
  if (includeCategories) filters.categories.forEach((c) => p.append('category', c))
  if (filters.free) p.set('free', 'true')
  const { from, to } = whenToRange(filters.when, now)
  if (from) p.set('date_from', from.toISOString())
  if (to) p.set('date_to', to.toISOString())
  if (filters.near) {
    p.set('lat', String(filters.near.lat))
    p.set('lon', String(filters.near.lon))
    p.set('radius_km', String(NEAR_RADIUS_KM))
  }
  return p
}

export function isDefault(filters: Filters): boolean {
  return toSearch(filters, null) === ''
}
