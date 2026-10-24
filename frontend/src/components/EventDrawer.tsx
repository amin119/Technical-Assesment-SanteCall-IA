import { motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import type { EventDetail } from '../api/types'
import { useBook, useEvent } from '../hooks/queries'
import { priceLabel } from '../lib/format'

const BOOKING_MESSAGES: Record<string, string> = {
  sold_out: 'Complet : quelqu’un a réservé la dernière place juste avant vous.',
  already_booked: 'Vous avez déjà une place pour cet événement.',
  busy: 'Beaucoup de monde réserve en ce moment. Réessayez dans un instant.',
  validation_error: 'Cette adresse e-mail ne semble pas valide.',
}

function SeatMeter({ left, capacity }: { left: number; capacity: number }) {
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
          <strong>Complet</strong>
        ) : (
          <>
            <strong>{left}</strong> place{left > 1 ? 's' : ''} restante{left > 1 ? 's' : ''} sur {capacity}
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

function BookingForm({ event }: { event: EventDetail }) {
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
          <strong>Place réservée.</strong>
          <br />
          Au nom de {book.data.email}.
        </p>
      </motion.div>
    )
  }

  const error = book.error instanceof ApiError ? (BOOKING_MESSAGES[book.error.code] ?? book.error.message) : book.error ? 'Réservation impossible pour le moment.' : null

  return (
    <form className="booking" onSubmit={submit}>
      <label htmlFor="booking-email">Votre e-mail</label>
      <div className="booking__row">
        <input
          id="booking-email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={soldOut}
        />
        <button type="submit" className="btn" disabled={book.isPending || soldOut}>
          {soldOut ? 'Complet' : book.isPending ? 'Réservation…' : 'Réserver'}
        </button>
      </div>
      {error && (
        <motion.p className="booking__error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          {error}
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
  const { data: event, isError, refetch } = useEvent(eventId)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
        aria-label={event?.title ?? 'Détail de l’événement'}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <button ref={closeRef} type="button" className="drawer__close" onClick={onClose} aria-label="Fermer">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {isError && (
          <div className="state">
            <p>Impossible de charger cet événement.</p>
            <button type="button" className="btn btn--ghost" onClick={() => void refetch()}>
              Réessayer
            </button>
          </div>
        )}

        {!event && !isError && <div className="drawer__loading sk" />}

        {event && (
          <div className="drawer__content">
            {event.cover_url && <img className="drawer__cover" src={event.cover_url} alt="" loading="lazy" />}
            <p className="drawer__meta">
              {event.category_label} · {priceLabel(event)}
            </p>
            <h2 className="drawer__title">{event.title}</h2>

            <dl className="facts">
              <div>
                <dt>Quand</dt>
                <dd>{event.when_text || '—'}</dd>
              </div>
              <div>
                <dt>Où</dt>
                <dd>
                  {[event.venue_name, event.address, event.zipcode].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              {event.price_detail && (
                <div>
                  <dt>Tarif</dt>
                  <dd>{event.price_detail}</dd>
                </div>
              )}
            </dl>

            <section className="reserve" aria-label="Réservation">
              <SeatMeter left={event.seats_left} capacity={event.capacity} />
              <BookingForm key={event.id} event={event} />
            </section>

            {(event.description || event.summary) && (
              <div className="prose">
                {(event.description || event.summary).split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            {event.source_url && (
              <a className="drawer__source" href={event.source_url} target="_blank" rel="noreferrer">
                Voir la fiche sur paris.fr ↗
              </a>
            )}
          </div>
        )}
      </motion.aside>
    </>
  )
}
