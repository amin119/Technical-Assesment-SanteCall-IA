import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../i18n/useI18n'
import type { When } from '../lib/filters'
import { formatCount, formatLongDate } from '../lib/format'

interface Props {
  when: When
  total: number | undefined
  now: number
}

/** The headline rewrites itself when the date filter changes: the filter is part of the sentence. */
export function Hero({ when, total, now }: Props) {
  const { t, tp, lang } = useI18n()
  const phrase = t(`when.${when}.phrase`)
  return (
    <section className="hero">
      <p className="hero__date">{formatLongDate(new Date(now), lang)}</p>
      <h1 className="hero__title">
        {t('hero.before')}
        <span className="hero__swap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.em
              key={phrase}
              initial={{ y: '70%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-70%', opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {phrase}
            </motion.em>
          </AnimatePresence>
        </span>
        {t('hero.after')}
      </h1>
      <p className="hero__count" aria-live="polite">
        {total === undefined ? ' ' : tp('hero.count', total, { n: formatCount(total, lang) })}
      </p>
    </section>
  )
}
