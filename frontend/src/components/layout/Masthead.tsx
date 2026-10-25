import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../../i18n/useI18n'
import type { When } from '../../lib/filters'
import { formatLongDate } from '../../lib/format'
import './layout.css'

interface Props {
  when: When
  now: number
}

/** The headline rewrites itself when the date filter changes: the filter is part of the sentence. */
export function Masthead({ when, now }: Props) {
  const { t, lang } = useI18n()
  const phrase = t(`when.${when}.phrase`)
  return (
    <section className="masthead shell">
      <p className="masthead__date">{formatLongDate(new Date(now), lang)}</p>
      <h1 className="masthead__title">
        {t('hero.before')}
        <span className="masthead__swap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.em
              key={phrase}
              initial={{ y: '60%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-60%', opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {phrase}
            </motion.em>
          </AnimatePresence>
        </span>
        {t('hero.after')}
      </h1>
      <p className="masthead__lede">{t('hero.lede')}</p>
    </section>
  )
}
