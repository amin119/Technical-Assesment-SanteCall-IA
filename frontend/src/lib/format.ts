import type { EventSummary } from '../api/types'

const TZ = 'Europe/Paris'
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...options })

const weekday = fmt({ weekday: 'short' })
const day = fmt({ day: 'numeric' })
const month = fmt({ month: 'short' })
const dayKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' })
const longDate = fmt({ weekday: 'long', day: 'numeric', month: 'long' })

export interface DateBlock {
  top: string
  big: string
  bottom: string
}

const clean = (s: string) => s.replace('.', '')

/** The big date shown at the left of a row. Events already running show when they end instead. */
export function dateBlock(event: Pick<EventSummary, 'starts_at' | 'ends_at'>, now: Date = new Date()): DateBlock {
  const start = new Date(event.starts_at)
  const end = new Date(event.ends_at)
  const runningFromBefore = start <= now && end > now && dayKey.format(start) !== dayKey.format(now)
  if (runningFromBefore) {
    return { top: 'jusqu’au', big: day.format(end), bottom: clean(month.format(end)) }
  }
  return { top: clean(weekday.format(start)), big: day.format(start), bottom: clean(month.format(start)) }
}

export function formatLongDate(date: Date): string {
  return longDate.format(date)
}

export function priceLabel(event: Pick<EventSummary, 'is_free' | 'price_type'>): string {
  if (event.is_free) return 'Gratuit'
  return event.price_type === 'payant' ? 'Payant' : event.price_type || 'Tarif sur place'
}

export function seatsLabel(left: number, capacity: number): string {
  if (left === 0) return 'Complet'
  if (left <= Math.max(3, capacity * 0.1)) return `Plus que ${left} place${left > 1 ? 's' : ''}`
  return `${left} places`
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}
