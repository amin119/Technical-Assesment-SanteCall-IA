// Pure helpers for numbered pagination, so they are easy to test.

export type PageItem = number | 'gap'

export const pageCount = (total: number, pageSize: number): number => Math.max(1, Math.ceil(total / pageSize))

/**
 * The page numbers to show: always the first and last page, the current page with `siblings` on each
 * side, and a gap marker where pages are skipped. With 145 pages and page 6: 1 … 4 5 6 7 8 … 145.
 * A gap that would hide a single page shows that page instead, so "…" never replaces one number.
 */
export function pageWindow(current: number, count: number, siblings = 1): PageItem[] {
  const first = 1
  const start = Math.max(first + 1, current - siblings)
  const end = Math.min(count - 1, current + siblings)
  const items: PageItem[] = [first]

  if (start > first + 2) items.push('gap')
  else if (start === first + 2) items.push(first + 1)

  for (let n = start; n <= end; n++) items.push(n)

  if (end < count - 2) items.push('gap')
  else if (end === count - 2) items.push(count - 1)

  if (count > first) items.push(count)
  return items
}

/** "21–40": the range of results on a page, for the summary line. */
export function pageRange(page: number, pageSize: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 }
  const from = (page - 1) * pageSize + 1
  return { from, to: Math.min(total, page * pageSize) }
}
