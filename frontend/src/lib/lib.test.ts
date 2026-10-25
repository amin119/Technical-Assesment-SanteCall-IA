import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translator'
import { dateBlock, seatsLabel } from './format'
import { pageCount, pageRange, pageWindow } from './pagination'
import { DEFAULT_FILTERS, isDefault, parseSearch, toApiParams, toSearch, whenToRange } from './filters'

// 2026-10-24 is a Saturday; 2026-10-21 a Wednesday; 2026-10-25 a Sunday.
const saturday = new Date(2026, 9, 24, 14, 0)
const wednesday = new Date(2026, 9, 21, 10, 0)
const fr = createTranslator('fr')
const sunday = new Date(2026, 9, 25, 9, 0)

describe('whenToRange', () => {
  it('weekend from midweek spans Saturday 00:00 to Sunday 23:59', () => {
    const { from, to } = whenToRange('weekend', wednesday)
    expect(from).toEqual(new Date(2026, 9, 24, 0, 0))
    expect(to?.getDate()).toBe(25)
    expect(to?.getHours()).toBe(23)
  })

  it('weekend on Saturday starts now, so finished events are not shown', () => {
    const { from, to } = whenToRange('weekend', saturday)
    expect(from).toEqual(saturday)
    expect(to?.getDate()).toBe(25)
  })

  it('weekend on Sunday only covers the rest of Sunday', () => {
    const { from, to } = whenToRange('weekend', sunday)
    expect(from).toEqual(sunday)
    expect(to?.getDate()).toBe(25)
  })

  it('tomorrow covers the whole next day', () => {
    const { from, to } = whenToRange('tomorrow', saturday)
    expect(from).toEqual(new Date(2026, 9, 25, 0, 0))
    expect(to?.getDate()).toBe(25)
  })

  it('"all" has no bounds', () => {
    expect(whenToRange('all', saturday)).toEqual({})
  })
})

describe('URL state', () => {
  it('round-trips filters and the selected event', () => {
    const filters = { q: 'jazz', when: 'weekend' as const, categories: ['concert', 'theatre'], free: true, near: { lat: 48.8566, lon: 2.3522 }, page: 4 }
    const parsed = parseSearch(toSearch(filters, 'abc'))
    expect(parsed.filters).toEqual(filters)
    expect(parsed.eventId).toBe('abc')
  })

  it('omits defaults so the URL stays clean', () => {
    expect(toSearch(DEFAULT_FILTERS, null)).toBe('')
    expect(isDefault(DEFAULT_FILTERS)).toBe(true)
  })

  it('ignores garbage instead of crashing', () => {
    const { filters } = parseSearch('?when=nonsense&near=abc')
    expect(filters.when).toBe('all')
    expect(filters.near).toBeNull()
  })

  it('keeps page 1 out of the URL and repairs bad page numbers', () => {
    expect(toSearch({ ...DEFAULT_FILTERS, page: 1 }, null)).toBe('')
    expect(toSearch({ ...DEFAULT_FILTERS, page: 3 }, null)).toBe('?page=3')
    for (const bad of ['0', '-2', 'abc', '2.5', '']) expect(parseSearch(`?page=${bad}`).filters.page).toBe(1)
  })

  it('does not send the page to the API as a filter', () => {
    expect(toApiParams({ ...DEFAULT_FILTERS, page: 9 }).has('page')).toBe(false)
  })
})

describe('toApiParams', () => {
  it('repeats category and only sends bounds that exist', () => {
    const p = toApiParams({ ...DEFAULT_FILTERS, categories: ['concert', 'sport'], free: true }, saturday)
    expect(p.getAll('category')).toEqual(['concert', 'sport'])
    expect(p.get('free')).toBe('true')
    expect(p.has('date_from')).toBe(false)
  })

  it('can leave categories out (used for the counts)', () => {
    const p = toApiParams({ ...DEFAULT_FILTERS, categories: ['concert'] }, saturday, false)
    expect(p.has('category')).toBe(false)
  })

  it('sends a radius with the location', () => {
    const p = toApiParams({ ...DEFAULT_FILTERS, near: { lat: 48.85, lon: 2.35 } }, saturday)
    expect(p.get('radius_km')).toBe('3')
  })
})

describe('format', () => {
  it('shows an end date for events that started on an earlier day', () => {
    const block = dateBlock({ starts_at: '2026-09-01T08:00:00Z', ends_at: '2026-12-31T22:00:00Z' }, saturday, fr)
    expect(block.top).toBe('jusqu’au')
    expect(block.big).toBe('31')
  })

  it('shows the start date for upcoming events', () => {
    const block = dateBlock({ starts_at: '2026-11-07T19:00:00Z', ends_at: '2026-11-07T21:00:00Z' }, saturday, fr)
    expect(block.big).toBe('7')
  })

  it('warns when few seats are left', () => {
    expect(seatsLabel(0, 100, fr)).toBe('Complet')
    expect(seatsLabel(2, 100, fr)).toBe('Plus que 2 places')
    expect(seatsLabel(60, 100, fr)).toBe('60 places')
  })
})

describe('pagination', () => {
  it('counts pages, with at least one', () => {
    expect(pageCount(0, 20)).toBe(1)
    expect(pageCount(20, 20)).toBe(1)
    expect(pageCount(21, 20)).toBe(2)
    expect(pageCount(2887, 20)).toBe(145)
  })

  it('shows every page when there are few', () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('puts gaps only where they hide two or more pages', () => {
    expect(pageWindow(1, 145)).toEqual([1, 2, 'gap', 145])
    expect(pageWindow(6, 145)).toEqual([1, 'gap', 5, 6, 7, 'gap', 145])
    expect(pageWindow(4, 145)).toEqual([1, 2, 3, 4, 5, 'gap', 145])
    expect(pageWindow(145, 145)).toEqual([1, 'gap', 144, 145])
  })

  it('never lists a page twice or out of order', () => {
    for (const count of [1, 2, 3, 7, 50]) {
      for (let page = 1; page <= count; page++) {
        const numbers = pageWindow(page, count).filter((i): i is number => i !== 'gap')
        expect(numbers).toEqual([...new Set(numbers)].sort((a, b) => a - b))
        expect(numbers).toContain(page)
        expect(numbers[0]).toBe(1)
        expect(numbers.at(-1)).toBe(count)
      }
    }
  })

  it('gives the range of results on a page', () => {
    expect(pageRange(1, 20, 2887)).toEqual({ from: 1, to: 20 })
    expect(pageRange(145, 20, 2887)).toEqual({ from: 2881, to: 2887 })
    expect(pageRange(1, 20, 0)).toEqual({ from: 0, to: 0 })
  })
})
