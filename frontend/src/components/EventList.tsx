import { motion } from 'motion/react'
import type { EventSummary } from '../api/types'
import { useI18n } from '../i18n/useI18n'
import { arrondissementLabel, categoryLabel, dateBlock, priceLabel, seatsLabel } from '../lib/format'

interface RowProps {
  event: EventSummary
  index: number
  now: number
  selected: boolean
  hovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

function EventRow({ event, index, now, selected, hovered, onSelect, onHover }: RowProps) {
  const i18n = useI18n()
  const date = dateBlock(event, new Date(now), i18n)
  const place = [event.venue_name, event.arrondissement ? arrondissementLabel(event.arrondissement, i18n.lang) : null]
    .filter(Boolean)
    .join(' · ')
  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1], delay: Math.min(index % 30, 12) * 0.03 }}
    >
      <button
        type="button"
        className={`row${selected ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}`}
        onClick={() => onSelect(event.id)}
        onMouseEnter={() => onHover(event.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(event.id)}
        onBlur={() => onHover(null)}
      >
        <span className="row__date">
          <span className="row__dow">{date.top}</span>
          <span className="row__day">{date.big}</span>
          <span className="row__month">{date.bottom}</span>
        </span>
        <span className="row__body">
          <span className="row__meta">
            {categoryLabel(event.category, event.category_label, i18n)}
            {place && ` · ${place}`}
          </span>
          {/* Titles and summaries come from Paris Open Data and are published in French. */}
          <span className="row__title" lang="fr">
            {event.title}
          </span>
          {event.summary && (
            <span className="row__summary" lang="fr">
              {event.summary}
            </span>
          )}
        </span>
        <span className="row__aside">
          <span className={event.is_free ? 'row__price is-free' : 'row__price'}>{priceLabel(event, i18n)}</span>
          <span className={event.seats_left <= 3 ? 'row__seats is-low' : 'row__seats'}>
            {seatsLabel(event.seats_left, event.capacity, i18n)}
          </span>
          {event.distance_km !== null && <span className="row__seats">{event.distance_km.toFixed(1)} km</span>}
        </span>
      </button>
    </motion.li>
  )
}

interface ListProps {
  events: EventSummary[]
  now: number
  selectedId: string | null
  hoveredId: string | null
  hasMore: boolean
  loadingMore: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onMore: () => void
}

export function EventList({ events, now, selectedId, hoveredId, hasMore, loadingMore, onSelect, onHover, onMore }: ListProps) {
  const { t } = useI18n()
  return (
    <>
      <ul className="list">
        {events.map((e, i) => (
          <EventRow
            key={e.id}
            event={e}
            index={i}
            now={now}
            selected={e.id === selectedId}
            hovered={e.id === hoveredId}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </ul>
      {hasMore && (
        <button type="button" className="more" onClick={onMore} disabled={loadingMore}>
          {loadingMore ? t('list.loadingMore') : t('list.more')}
        </button>
      )}
    </>
  )
}

export function ListSkeleton() {
  const { t } = useI18n()
  return (
    <ul className="list" aria-busy="true" aria-label={t('list.loading')}>
      {Array.from({ length: 7 }, (_, i) => (
        <li key={i} className="row row--skeleton" aria-hidden="true">
          <span className="sk sk--date" />
          <span className="row__body">
            <span className="sk sk--meta" />
            <span className="sk sk--title" />
          </span>
        </li>
      ))}
    </ul>
  )
}
