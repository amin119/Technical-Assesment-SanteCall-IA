import { AnimatePresence, MotionConfig } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { EventDrawer } from './components/drawer/EventDrawer'
import { EventList, ListSkeleton } from './components/events/EventList'
import { FilterBar } from './components/filters/FilterBar'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { Masthead } from './components/layout/Masthead'
import { MapPanel } from './components/map/MapPanel'
import { Button } from './components/ui/Button'
import { Icon } from './components/ui/Icon'
import { StateMessage } from './components/ui/StateMessage'
import { useCategories, useEvents, useGeo } from './hooks/queries'
import { useLocate } from './hooks/useLocate'
import { useUrlState } from './hooks/useUrlState'
import { useI18n } from './i18n/useI18n'
import { DEFAULT_FILTERS, isDefault, toApiParams, type Filters } from './lib/filters'
import { formatCount } from './lib/format'
import './App.css'

export default function App() {
  const { t, tp, lang } = useI18n()
  const [{ filters, eventId, stamp }, update] = useUrlState()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')

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
  const reset = () => update({ filters: DEFAULT_FILTERS })
  const select = useCallback((id: string) => update({ eventId: id }), [update])
  const close = useCallback(() => update({ eventId: null }, true), [update])
  const { locating, error: geoError, locate } = useLocate(filters.near, (near) => setFilters({ near }))

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
          <section className="results" aria-label={t('list.label')}>
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
