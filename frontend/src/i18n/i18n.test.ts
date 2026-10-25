import { describe, expect, it } from 'vitest'
import { arrondissementLabel, categoryLabel, dateBlock, formatCount, priceLabel, seatsLabel } from '../lib/format'
import { en, fr } from './messages'
import { createTranslator, detectLang } from './translator'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('messages', () => {
  it('French and English define exactly the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort())
  })

  it('every message has the same {placeholders} in both languages', () => {
    for (const key of Object.keys(fr) as (keyof typeof fr)[]) {
      expect(placeholders(en[key]), key).toEqual(placeholders(fr[key]))
    }
  })

  it('no message is empty', () => {
    for (const dict of [fr, en]) for (const [key, value] of Object.entries(dict)) expect(value.trim(), key).not.toBe('')
  })

  it('every plural has both forms', () => {
    for (const dict of [fr, en]) {
      const keys = Object.keys(dict)
      for (const key of keys.filter((k) => k.endsWith('_one'))) expect(keys).toContain(key.replace(/_one$/, '_other'))
    }
  })
})

describe('translator', () => {
  const trFr = createTranslator('fr')
  const trEn = createTranslator('en')

  it('fills placeholders', () => {
    expect(trFr.t('booking.doneFor', { email: 'a@b.fr' })).toBe('Au nom de a@b.fr.')
    expect(trEn.t('booking.doneFor', { email: 'a@b.fr' })).toBe('Booked for a@b.fr.')
  })

  it('applies each language’s plural rule (French treats 0 as singular, English does not)', () => {
    expect(trFr.tp('hero.count', 0)).toBe('0 événement')
    expect(trEn.tp('hero.count', 0)).toBe('0 events')
    expect(trFr.tp('hero.count', 1)).toBe('1 événement')
    expect(trEn.tp('hero.count', 1)).toBe('1 event')
    expect(trFr.tp('hero.count', 2)).toBe('2 événements')
    expect(trEn.tp('hero.count', 2)).toBe('2 events')
  })

  it('knows which keys exist', () => {
    expect(trEn.has('cat.concert')).toBe(true)
    expect(trEn.has('cat.unknown')).toBe(false)
  })
})

describe('detectLang', () => {
  it('prefers the URL, then the saved choice, then the browser', () => {
    expect(detectLang('?lang=en', 'fr', ['fr-FR'])).toBe('en')
    expect(detectLang('', 'en', ['fr-FR'])).toBe('en')
    expect(detectLang('', null, ['fr-FR', 'en'])).toBe('fr')
    expect(detectLang('', null, ['de-DE'])).toBe('en')
  })

  it('ignores unsupported values', () => {
    expect(detectLang('?lang=de', 'es', ['fr'])).toBe('fr')
    expect(detectLang('?lang=de', 'es', ['de'])).toBe('en')
  })
})

describe('localised formatting', () => {
  const trFr = createTranslator('fr')
  const trEn = createTranslator('en')
  const now = new Date(2026, 9, 24, 14, 0)

  it('formats dates in the visitor’s language', () => {
    const event = { starts_at: '2026-11-07T19:00:00Z', ends_at: '2026-11-07T21:00:00Z' }
    expect(dateBlock(event, now, trFr)).toEqual({ top: 'sam', big: '7', bottom: 'nov' })
    expect(dateBlock(event, now, trEn)).toEqual({ top: 'Sat', big: '7', bottom: 'Nov' })
  })

  it('says "until" in both languages for events already running', () => {
    const event = { starts_at: '2026-09-01T08:00:00Z', ends_at: '2026-12-31T22:00:00Z' }
    expect(dateBlock(event, now, trFr).top).toBe('jusqu’au')
    expect(dateBlock(event, now, trEn).top).toBe('until')
  })

  it('formats numbers with each language’s separators', () => {
    expect(formatCount(2960, 'en')).toBe('2,960')
    expect(formatCount(2960, 'fr').replace(/\s/g, ' ')).toBe('2 960')
  })

  it('translates prices, seats and categories', () => {
    expect(priceLabel({ is_free: true, price_type: 'gratuit' }, trEn)).toBe('Free')
    expect(priceLabel({ is_free: false, price_type: 'payant' }, trEn)).toBe('Paid')
    expect(seatsLabel(0, 100, trEn)).toBe('Sold out')
    expect(seatsLabel(1, 100, trEn)).toBe('Only 1 seat left')
    expect(seatsLabel(60, 100, trFr)).toBe('60 places')
    expect(categoryLabel('theatre', 'Théâtre', trEn)).toBe('Theatre')
    expect(categoryLabel('new-slug', 'Server label', trEn)).toBe('Server label')
  })

  it('writes Paris districts as people do', () => {
    expect(arrondissementLabel(1, 'fr')).toBe('1er')
    expect(arrondissementLabel(9, 'fr')).toBe('9e')
    expect(arrondissementLabel(1, 'en')).toBe('1st')
    expect(arrondissementLabel(2, 'en')).toBe('2nd')
    expect(arrondissementLabel(3, 'en')).toBe('3rd')
    expect(arrondissementLabel(11, 'en')).toBe('11th')
    expect(arrondissementLabel(12, 'en')).toBe('12th')
    expect(arrondissementLabel(20, 'en')).toBe('20th')
  })
})
