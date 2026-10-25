import { motion } from 'motion/react'
import type { EventSummary } from '../../api/types'
import { useI18n } from '../../i18n/useI18n'
import { arrondissementLabel, categoryLabel, dateBlock, priceLabel, seatsLabel } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { Thumb } from './Thumb'

interface Props {
  event: EventSummary
  index: number
  now: number
  selected: boolean
  hovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function EventCard({ event, index, now, selected, hovered, onSelect, onHover }: Props) {
  const i18n = useI18n()
  const { t } = i18n
  const date = dateBlock(event, new Date(now), i18n)
  const full = event.seats_left === 0
  const few = !full && event.seats_left <= Math.max(3, event.capacity * 0.1)
  const place = [event.venue_name, event.arrondissement ? arrondissementLabel(event.arrondissement, i18n.lang) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1], delay: Math.min(index % 30, 10) * 0.03 }}
    >
      <article
        className={`card${selected ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}${full ? ' is-full' : ''}`}
        onMouseEnter={() => onHover(event.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="card__media">
          <Thumb src={event.cover_url} />
          <span className="card__date">{`${date.top} ${date.big} ${date.bottom}`}</span>
        </div>

        <div className="card__body">
          <p className="card__meta">
            {categoryLabel(event.category, event.category_label, i18n)}
            {place && ` · ${place}`}
          </p>

          {/* Title and summary come from Paris Open Data and are published in French. */}
          <h2 className="card__title" lang="fr">
            {/* The button's ::after stretches over the whole card, so the card is one big target. */}
            <button
              type="button"
              className="card__open"
              aria-pressed={selected}
              onClick={() => onSelect(event.id)}
              onFocus={() => onHover(event.id)}
              onBlur={() => onHover(null)}
            >
              {event.title}
            </button>
          </h2>
          {event.summary && (
            <p className="card__summary" lang="fr">
              {event.summary}
            </p>
          )}

          <footer className="card__foot">
            <div className="card__tags">
              <Badge tone={event.is_free ? 'free' : 'neutral'}>{priceLabel(event, i18n)}</Badge>
              {full || few ? (
                <Badge tone={full ? 'neutral' : 'few'}>{seatsLabel(event.seats_left, event.capacity, i18n)}</Badge>
              ) : (
                <span className="card__seats">
                  <Icon name="seat" size={15} />
                  {seatsLabel(event.seats_left, event.capacity, i18n)}
                </span>
              )}
              {event.distance_km !== null && <span className="card__seats">{event.distance_km.toFixed(1)} km</span>}
            </div>
            {!full && (
              <span className="card__cta" aria-hidden="true">
                {t('card.reserve')}
                <Icon name="arrow" size={15} />
              </span>
            )}
          </footer>
        </div>
      </article>
    </motion.li>
  )
}
