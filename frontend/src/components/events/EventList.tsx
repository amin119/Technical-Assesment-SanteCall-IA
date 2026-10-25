import type { EventSummary } from '../../api/types'
import { useI18n } from '../../i18n/useI18n'
import { Button } from '../ui/Button'
import { EventCard } from './EventCard'
import './events.css'

interface Props {
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

export function EventList({ events, now, selectedId, hoveredId, hasMore, loadingMore, onSelect, onHover, onMore }: Props) {
  const { t } = useI18n()
  return (
    <>
      <ul className="cards">
        {events.map((e, i) => (
          <EventCard
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
        <div className="cards__more">
          <Button variant="secondary" onClick={onMore} disabled={loadingMore}>
            {loadingMore ? t('list.loadingMore') : t('list.more')}
          </Button>
        </div>
      )}
    </>
  )
}

export function ListSkeleton() {
  const { t } = useI18n()
  return (
    <ul className="cards" aria-busy="true" aria-label={t('list.loading')}>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="card card--skeleton" aria-hidden="true">
          <span className="skeleton card__media" />
          <span className="card__body">
            <span className="skeleton" style={{ height: 12, width: '40%' }} />
            <span className="skeleton" style={{ height: 24, width: '80%' }} />
            <span className="skeleton" style={{ height: 14, width: '95%' }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
