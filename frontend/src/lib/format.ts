import type { EventSummary } from '../api/types'
import { LOCALES, type Lang, type Translator } from '../i18n/translator'

// Events happen in Paris, so dates are always shown in Paris time, whatever the visitor's timezone.
const TZ = 'Europe/Paris'

interface Formatters {
  weekday: Intl.DateTimeFormat
  day: Intl.DateTimeFormat
  month: Intl.DateTimeFormat
  longDate: Intl.DateTimeFormat
  number: Intl.NumberFormat
}

const cache = new Map<Lang, Formatters>()

function formatters(lang: Lang): Formatters {
  let f = cache.get(lang)
  if (!f) {
    const make = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(LOCALES[lang], { timeZone: TZ, ...options })
    f = {
      weekday: make({ weekday: 'short' }),
      day: make({ day: 'numeric' }),
      month: make({ month: 'short' }),
      longDate: make({ weekday: 'long', day: 'numeric', month: 'long' }),
      number: new Intl.NumberFormat(LOCALES[lang]),
    }
    cache.set(lang, f)
  }
  return f
}

// Same calendar day in Paris? (Comparing formatted strings sidesteps timezone arithmetic.)
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })

export interface DateBlock {
  top: string
  big: string
  bottom: string
}

const clean = (s: string) => s.replace('.', '')

/** The big date shown at the left of a row. Events already running show when they end instead. */
export function dateBlock(
  event: Pick<EventSummary, 'starts_at' | 'ends_at'>,
  now: Date,
  tr: Translator,
): DateBlock {
  const f = formatters(tr.lang)
  const start = new Date(event.starts_at)
  const end = new Date(event.ends_at)
  const runningFromBefore = start <= now && end > now && dayKey.format(start) !== dayKey.format(now)
  if (runningFromBefore) {
    return { top: tr.t('row.until'), big: f.day.format(end), bottom: clean(f.month.format(end)) }
  }
  return { top: clean(f.weekday.format(start)), big: f.day.format(start), bottom: clean(f.month.format(start)) }
}

export function formatLongDate(date: Date, lang: Lang): string {
  return formatters(lang).longDate.format(date)
}

export function formatCount(n: number, lang: Lang): string {
  return formatters(lang).number.format(n)
}

export function priceLabel(event: Pick<EventSummary, 'is_free' | 'price_type'>, tr: Translator): string {
  if (event.is_free) return tr.t('price.free')
  if (event.price_type === 'payant') return tr.t('price.paid')
  return event.price_type || tr.t('price.onsite')
}

export function seatsLabel(left: number, capacity: number, tr: Translator): string {
  if (left === 0) return tr.t('seats.full')
  if (left <= Math.max(3, capacity * 0.1)) return tr.tp('seats.few', left)
  return tr.tp('seats.many', left)
}

const ENGLISH_ORDINALS = new Intl.PluralRules(LOCALES.en, { type: 'ordinal' })
const ENGLISH_SUFFIX: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' }

/** Paris district as people write it: 1er, 9e (French) and 1st, 9th (English). */
export function arrondissementLabel(n: number, lang: Lang): string {
  if (lang === 'fr') return n === 1 ? '1er' : `${n}e`
  return `${n}${ENGLISH_SUFFIX[ENGLISH_ORDINALS.select(n)]}`
}

/** Category name in the current language. Falls back to the server's label for an unknown slug. */
export function categoryLabel(slug: string, fallback: string, tr: Translator): string {
  const key = `cat.${slug}`
  return tr.has(key) ? tr.t(key) : fallback
}
