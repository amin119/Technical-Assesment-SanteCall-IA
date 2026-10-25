import { AnimatePresence, MotionConfig } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EventDrawer } from './components/drawer/EventDrawer'
import { EventList, ListSkeleton } from './components/events/EventList'
import { FilterBar } from './components/filters/FilterBar'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { Masthead } from './components/layout/Masthead'
import { MapPanel } from './components/map/MapPanel'
import { Button } from './components/ui/Button'
import { Icon } from './components/ui/Icon'
import { Pagination } from './components/ui/Pagination'
import { StateMessage } from './components/ui/StateMessage'
import { PAGE_SIZE, useCategories, useEvents, useGeo } from './hooks/queries'
import { useLocate } from './hooks/useLocate'
import { useUrlState } from './hooks/useUrlState'
import { useI18n } from './i18n/useI18n'
import { DEFAULT_FILTERS, isDefault, toApiParams, type Filters } from './lib/filters'
import { formatCount } from './lib/format'
import { pageCount } from './lib/pagination'
import './App.css'

export default function App() {
  const { t, tp, lang } = useI18n()
  const [{ filters, eventId, stamp }, update] = useUrlState()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')

  const params = useMemo(() => toApiParams(filters, new Date(stamp)), [filters, stamp])
  const countParams = useMemo(() => toApiParams(filters, new Date(stamp), false), [filters, stamp])

  const events = useEvents(params, filters.page, filters.near !== null)
  const categories = useCategories(countParams)
  const geo = useGeo(params)

  const items = events.data?.items ?? []
  const total = events.data?.total
  const resultsRef = useRef<HTMLElement>(null)

  const setFilters = useCallback(
    // Any filter change goes back to page 1: page 7 of the old results means nothing for the new ones.
    (patch: Partial<Filters>, replace = false) => update({ filters: { ...filters, page: 1, ...patch } }, replace),
    [filters, update],
  )
  const goToPage = (page: number) => {
    update({ filters: { ...filters, page } })
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }
  const reset = () => update({ filters: DEFAULT_FILTERS })
  const select = useCallback((id: string) => update({ eventId: id }), [update])
  const close = useCallback(() => update({ eventId: null }, true), [update])
  const { locating, error: geoError, locate } = useLocate(filters.near, (near) => setFilters({ near }))

  // A link to a page that no longer exists (the list got shorter): go to the last real page.
  const lastPage = total === undefined ? undefined : pageCount(total, PAGE_SIZE)
  useEffect(() => {
    if (lastPage !== undefined && !events.isPlaceholderData && filters.page > lastPage) {
      update({ filters: { ...filters, page: lastPage } }, true)
    }
  }, [lastPage, events.isPlaceholderData, filters, update])

  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main>
        <Masthead when={filters.when} now={stamp} />

        <FilterBar
          filters={filters}
          categories={categories.data}
          canReset={!isDefault(filters)}
          locating={locating}
          geoError={geoError}
          onChange={setFilters}
          onLocate={locate}
          onReset={reset}
        />

        <div className={`split shell split--${view}`}>
          <section className="results" ref={resultsRef} aria-label={t('list.label')}>
            <p className="results__count" aria-live="polite">
              {total !== undefined && tp('hero.count', total, { n: formatCount(total, lang) })}
              {total !== undefined && filters.near && ` · ${t('list.byDistance')}`}
            </p>

            {events.isPending && <ListSkeleton />}

            {events.isError && (
              <StateMessage message={t('state.listError')} actionLabel={t('state.retry')} onAction={() => void events.refetch()} />
            )}

            {events.isSuccess && items.length === 0 && (
              <StateMessage message={t('state.empty')} actionLabel={t('state.clear')} onAction={reset} />
            )}

            {items.length > 0 && (
              <div className={events.isPlaceholderData ? 'results__page is-loading' : 'results__page'} aria-busy={events.isPlaceholderData}>
                <EventList
                  events={items}
                  now={stamp}
                  selectedId={eventId}
                  hoveredId={hoveredId}
                  onSelect={select}
                  onHover={setHoveredId}
                />
              </div>
            )}

            {total !== undefined && <Pagination page={filters.page} pageSize={PAGE_SIZE} total={total} onChange={goToPage} />}
          </section>

          <div className="split__map">
            <MapPanel
              points={geo.data ?? []}
              selectedId={eventId}
              hoveredId={hoveredId}
              near={filters.near}
              onSelect={select}
              onHover={setHoveredId}
            />
          </div>
        </div>
      </main>
      <Footer />

      <Button className="viewtoggle" onClick={() => setView(view === 'list' ? 'map' : 'list')}>
        <Icon name={view === 'list' ? 'map' : 'list'} size={17} />
        {view === 'list' ? t('view.map') : t('view.list')}
      </Button>

      <AnimatePresence>{eventId && <EventDrawer key={eventId} eventId={eventId} onClose={close} />}</AnimatePresence>
    </MotionConfig>
  )
}
