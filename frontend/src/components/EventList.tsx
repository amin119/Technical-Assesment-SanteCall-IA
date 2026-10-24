import { motion } from 'motion/react'
import type { EventSummary } from '../api/types'
import { dateBlock, priceLabel, seatsLabel } from '../lib/format'

interface RowProps {
  event: EventSummary
  index: number
  selected: boolean
  hovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

function EventRow({ event, index, selected, hovered, onSelect, onHover }: RowProps) {
  const date = dateBlock(event)
  const place = [event.venue_name, event.arrondissement ? `${event.arrondissement}${event.arrondissement === 1 ? 'er' : 'e'}` : null]
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
            {event.category_label}
            {place && ` · ${place}`}
          </span>
          <span className="row__title">{event.title}</span>
          {event.summary && <span className="row__summary">{event.summary}</span>}
        </span>
        <span className="row__aside">
          <span className={event.is_free ? 'row__price is-free' : 'row__price'}>{priceLabel(event)}</span>
          <span className={event.seats_left <= 3 ? 'row__seats is-low' : 'row__seats'}>
            {seatsLabel(event.seats_left, event.capacity)}
          </span>
          {event.distance_km !== null && <span className="row__seats">{event.distance_km.toFixed(1)} km</span>}
        </span>
      </button>
    </motion.li>
  )
}

interface ListProps {
  events: EventSummary[]
  selectedId: string | null
  hoveredId: string | null
  hasMore: boolean
  loadingMore: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onMore: () => void
}

export function EventList({ events, selectedId, hoveredId, hasMore, loadingMore, onSelect, onHover, onMore }: ListProps) {
  return (
    <>
      <ul className="list">
        {events.map((e, i) => (
          <EventRow
            key={e.id}
            event={e}
            index={i}
            selected={e.id === selectedId}
            hovered={e.id === hoveredId}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </ul>
      {hasMore && (
        <button type="button" className="more" onClick={onMore} disabled={loadingMore}>
          {loadingMore ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </>
  )
}

export function ListSkeleton() {
  return (
    <ul className="list" aria-busy="true" aria-label="Chargement des événements">
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
