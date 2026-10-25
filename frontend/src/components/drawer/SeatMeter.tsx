import { motion } from 'motion/react'
import { useI18n } from '../../i18n/useI18n'

export function SeatMeter({ left, capacity }: { left: number; capacity: number }) {
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
