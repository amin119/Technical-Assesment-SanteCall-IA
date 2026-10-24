import { useCallback, useEffect, useRef, useState } from 'react'
import { parseSearch, toSearch, type Filters } from '../lib/filters'

export interface UrlState {
  filters: Filters
  eventId: string | null
  /** When the filters were last changed. "Today" and "this weekend" are computed from it, so
   *  rendering stays pure and the date window refreshes whenever the user changes a filter. */
  stamp: number
}

const read = (): UrlState => ({ ...parseSearch(window.location.search), stamp: Date.now() })

/**
 * Filters and the open event live in the URL, not in component state.
 * Result: links are shareable, the back button works, and a refresh keeps the view.
 */
export function useUrlState() {
  const [state, setState] = useState<UrlState>(read)
  const current = useRef(state)

  useEffect(() => {
    const onPop = () => {
      current.current = read()
      setState(current.current)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  /** `replace` rewrites the current history entry (typing in search); otherwise a new one is added. */
  const update = useCallback((patch: Partial<Pick<UrlState, 'filters' | 'eventId'>>, replace = false) => {
    const next: UrlState = {
      ...current.current,
      ...patch,
      // Opening or closing the drawer must not change the list query, so only bump on filters.
      stamp: patch.filters ? Date.now() : current.current.stamp,
    }
    current.current = next
    setState(next)
    const url = window.location.pathname + toSearch(next.filters, next.eventId)
    if (replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
  }, [])

  return [state, update] as const
}
