import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import type { EventDetail } from '../../api/types'
import { useBook } from '../../hooks/queries'
import type { MessageKey } from '../../i18n/messages'
import { useI18n } from '../../i18n/useI18n'
import { Button } from '../ui/Button'

function Check() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
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

export function BookingForm({ event }: { event: EventDetail }) {
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

  const errorKey = book.error
    ? book.error instanceof ApiError
      ? (ERROR_KEYS[book.error.code] ?? 'booking.error.generic')
      : 'booking.error.generic'
    : null

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
        <Button type="submit" disabled={book.isPending || soldOut}>
          {soldOut ? t('booking.full') : book.isPending ? t('booking.pending') : t('booking.submit')}
        </Button>
      </div>
      {errorKey && (
        <motion.p className="booking__error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          {t(errorKey)}
        </motion.p>
      )}
    </form>
  )
}
