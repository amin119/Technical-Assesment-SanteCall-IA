import { motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import type { EventDetail } from '../api/types'
import { useBook, useEvent } from '../hooks/queries'
import { useI18n } from '../i18n/useI18n'
import type { MessageKey } from '../i18n/messages'
import { categoryLabel, priceLabel } from '../lib/format'

function SeatMeter({ left, capacity }: { left: number; capacity: number }) {
  const { t, tp } = useI18n()
  const taken = capacity - left
  const low = left <= Math.max(3, capacity * 0.1)
  return (
    <div className="meter">
      <div className="meter__track">
        <motion.div
          className={low ? 'meter__fill is-low' : 'meter__fill'}
          initial={{ width: 0 }}
          animate={{ width: `${(taken / capacity) * 100}%` }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </div>
      <p className="meter__text">
        {left === 0 ? (
          <strong>{t('meter.full')}</strong>
        ) : (
          <>
            <strong>{left}</strong> {tp('meter.left', left, { capacity })}
          </>
        )}
      </p>
    </div>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
      />
    </svg>
  )
}

/** The API sends a stable `code`; the wording for the user is ours, in their language. */
const ERROR_KEYS: Record<string, MessageKey> = {
  sold_out: 'booking.error.sold_out',
  already_booked: 'booking.error.already_booked',
  busy: 'booking.error.busy',
  validation_error: 'booking.error.validation_error',
}

function BookingForm({ event }: { event: EventDetail }) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const book = useBook(event.id)
  const soldOut = event.seats_left === 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    book.mutate(email)
  }

  if (book.isSuccess) {
    return (
      <motion.div className="booked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
        <Check />
        <p>
          <strong>{t('booking.done')}</strong>
          <br />
          {t('booking.doneFor', { email: book.data.email })}
        </p>
      </motion.div>
    )
  }

  const errorKey = book.error instanceof ApiError ? (ERROR_KEYS[book.error.code] ?? 'booking.error.generic') : book.error ? 'booking.error.generic' : null

  return (
    <form className="booking" onSubmit={submit}>
      <label htmlFor="booking-email">{t('booking.email')}</label>
      <div className="booking__row">
        <input
          id="booking-email"
          type="email"
          required
          autoComplete="email"
          placeholder={t('booking.placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={soldOut}
        />
        <button type="submit" className="btn" disabled={book.isPending || soldOut}>
          {soldOut ? t('booking.full') : book.isPending ? t('booking.pending') : t('booking.submit')}
        </button>
      </div>
      {errorKey && (
        <motion.p className="booking__error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          {t(errorKey)}
        </motion.p>
      )}
    </form>
  )
}

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
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {isError && (
          <div className="state">
            <p>{t('drawer.loadError')}</p>
            <button type="button" className="btn btn--ghost" onClick={() => void refetch()}>
              {t('state.retry')}
            </button>
          </div>
        )}

        {!event && !isError && <div className="drawer__loading sk" />}

        {event && (
          <div className="drawer__content">
            {event.cover_url && <img className="drawer__cover" src={event.cover_url} alt="" loading="lazy" />}
            <p className="drawer__meta">
              {categoryLabel(event.category, event.category_label, i18n)} · {priceLabel(event, i18n)}
            </p>
            {/* Event text is published in French by Paris Open Data: mark it so screen readers pronounce it right. */}
            <h2 className="drawer__title" lang="fr">
              {event.title}
            </h2>

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
              </a>
            )}
          </div>
        )}
      </motion.aside>
    </>
  )
}
