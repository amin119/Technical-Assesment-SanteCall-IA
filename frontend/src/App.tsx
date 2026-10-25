import { AnimatePresence, MotionConfig } from 'motion/react'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { EventDrawer } from './components/EventDrawer'
import { EventList, ListSkeleton } from './components/EventList'
import { FilterBar } from './components/FilterBar'
import { Hero } from './components/Hero'
import { LangSwitch } from './components/LangSwitch'
import { useCategories, useEvents, useGeo } from './hooks/queries'
import { useUrlState } from './hooks/useUrlState'
import { useI18n } from './i18n/useI18n'
import { DEFAULT_FILTERS, isDefault, toApiParams, type Filters } from './lib/filters'

// Leaflet is heavy and only needed once the page is up: load it in a separate chunk.
const MapView = lazy(() => import('./components/MapView'))

export default function App() {
  const { t } = useI18n()
  const [{ filters, eventId, stamp }, update] = useUrlState()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState(false)

  const params = useMemo(() => toApiParams(filters, new Date(stamp)), [filters, stamp])
  const countParams = useMemo(() => toApiParams(filters, new Date(stamp), false), [filters, stamp])

  const events = useEvents(params, filters.near !== null)
  const categories = useCategories(countParams)
  const geo = useGeo(params)

  const items = useMemo(() => events.data?.pages.flatMap((p) => p.items) ?? [], [events.data])
  const total = events.data?.pages[0]?.total

  const setFilters = useCallback(
    (patch: Partial<Filters>, replace = false) => update({ filters: { ...filters, ...patch } }, replace),
    [filters, update],
  )
  const select = useCallback((id: string) => update({ eventId: id }), [update])
  const close = useCallback(() => update({ eventId: null }, true), [update])

  const locate = () => {
    setGeoError(false)
    if (filters.near) return setFilters({ near: null })
    if (!navigator.geolocation) return setGeoError(true)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setFilters({ near: { lat: pos.coords.latitude, lon: pos.coords.longitude } })
      },
      () => {
        setLocating(false)
        setGeoError(true)
      },
      { timeout: 10_000 },
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <header className="masthead shell">
        <a className="wordmark" href="/" aria-label={t('brand.home')}>
          Sortir<span>.</span>
        </a>
        <LangSwitch />
      </header>

      <Hero when={filters.when} total={total} now={stamp} />

      <FilterBar
        filters={filters}
        categories={categories.data}
        canReset={!isDefault(filters)}
        locating={locating}
        geoError={geoError}
        onChange={setFilters}
        onLocate={locate}
        onReset={() => update({ filters: DEFAULT_FILTERS })}
      />

      <main className={`split shell split--${view}`}>
        <section className="results" aria-label={t('list.label')}>
          {events.isPending && <ListSkeleton />}

          {events.isError && (
            <div className="state">
              <p>{t('state.listError')}</p>
              <button type="button" className="btn btn--ghost" onClick={() => void events.refetch()}>
                {t('state.retry')}
              </button>
            </div>
          )}

          {events.isSuccess && items.length === 0 && (
            <div className="state">
              <p>{t('state.empty')}</p>
              <button type="button" className="btn btn--ghost" onClick={() => update({ filters: DEFAULT_FILTERS })}>
                {t('state.clear')}
              </button>
            </div>
          )}

          {items.length > 0 && (
            <EventList
              events={items}
              now={stamp}
              selectedId={eventId}
              hoveredId={hoveredId}
              hasMore={events.hasNextPage}
              loadingMore={events.isFetchingNextPage}
              onSelect={select}
              onHover={setHoveredId}
              onMore={() => void events.fetchNextPage()}
            />
          )}
        </section>

        <aside className="mapwrap" aria-label={t('map.label')}>
          <Suspense fallback={<div className="map map--loading" />}>
            <MapView
              points={geo.data ?? []}
              selectedId={eventId}
              hoveredId={hoveredId}
              near={filters.near}
              onSelect={select}
              onHover={setHoveredId}
            />
          </Suspense>
        </aside>
      </main>

      <footer className="footer shell">
        <p>{t('footer.note')}</p>
      </footer>

      <button type="button" className="viewtoggle" onClick={() => setView(view === 'list' ? 'map' : 'list')}>
        {view === 'list' ? t('view.map') : t('view.list')}
      </button>

      <AnimatePresence>{eventId && <EventDrawer key={eventId} eventId={eventId} onClose={close} />}</AnimatePresence>
    </MotionConfig>
  )
}
