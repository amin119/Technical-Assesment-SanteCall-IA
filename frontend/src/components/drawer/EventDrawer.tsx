import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useEvent } from '../../hooks/queries'
import { useI18n } from '../../i18n/useI18n'
import { categoryLabel, priceLabel } from '../../lib/format'
import { Thumb } from '../events/Thumb'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { StateMessage } from '../ui/StateMessage'
import { BookingForm } from './BookingForm'
import { SeatMeter } from './SeatMeter'
import './drawer.css'

interface Props {
  eventId: string
  onClose: () => void
}

export function EventDrawer({ eventId, onClose }: Props) {
  const i18n = useI18n()
  const { t } = i18n
  const { data: event, isError, refetch } = useEvent(eventId)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const description = event ? event.description || event.summary : ''

  return (
    <>
      <motion.div
        className="scrim"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={event?.title ?? t('drawer.label')}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <button ref={closeRef} type="button" className="drawer__close" onClick={onClose} aria-label={t('drawer.close')}>
          <Icon name="close" />
        </button>

        {isError && <StateMessage message={t('drawer.loadError')} actionLabel={t('state.retry')} onAction={() => void refetch()} />}

        {!event && !isError && <div className="drawer__loading skeleton" />}

        {event && (
          <div className="drawer__content">
            <div className="drawer__cover">
              <Thumb src={event.cover_url} />
            </div>

            <div className="drawer__head">
              <div className="drawer__tags">
                <Badge tone="brand">{categoryLabel(event.category, event.category_label, i18n)}</Badge>
                <Badge tone={event.is_free ? 'free' : 'neutral'}>{priceLabel(event, i18n)}</Badge>
              </div>
              {/* Event text is published in French by Paris Open Data: mark it so screen readers pronounce it right. */}
              <h2 className="drawer__title" lang="fr">
                {event.title}
              </h2>
            </div>

            <dl className="facts">
              <div>
                <dt>{t('drawer.when')}</dt>
                <dd lang="fr">{event.when_text || '—'}</dd>
              </div>
              <div>
                <dt>{t('drawer.where')}</dt>
                <dd>{[event.venue_name, event.address, event.zipcode].filter(Boolean).join(', ') || '—'}</dd>
              </div>
              {event.price_detail && (
                <div>
                  <dt>{t('drawer.price')}</dt>
                  <dd lang="fr">{event.price_detail}</dd>
                </div>
              )}
            </dl>

            <section className="reserve" aria-label={t('drawer.reservation')}>
              <SeatMeter left={event.seats_left} capacity={event.capacity} />
              <BookingForm key={event.id} event={event} />
            </section>

            {description && (
              <div className="prose" lang="fr">
                {description.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            {event.source_url && (
              <a className="drawer__source" href={event.source_url} target="_blank" rel="noreferrer">
                {t('drawer.source')}
                <Icon name="external" size={15} />
              </a>
            )}
          </div>
        )}
      </motion.aside>
    </>
  )
}
