import { useI18n } from '../../i18n/useI18n'
import { formatCount } from '../../lib/format'
import { pageCount, pageRange, pageWindow } from '../../lib/pagination'
import { Icon } from './Icon'

interface Props {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

/**
 * Numbered pages with previous/next, and a "21–40 of 2,887" summary.
 * Wide screens show a window of page numbers; narrow screens show "Page 3 of 145".
 */
export function Pagination({ page, pageSize, total, onChange }: Props) {
  const { t, lang } = useI18n()
  const count = pageCount(total, pageSize)
  if (total === 0) return null

  const { from, to } = pageRange(page, pageSize, total)
  const go = (n: number) => onChange(Math.min(count, Math.max(1, n)))

  return (
    <nav className="pager" aria-label={t('pager.label')}>
      <p className="pager__summary">
        {t('pager.summary', { from: formatCount(from, lang), to: formatCount(to, lang), total: formatCount(total, lang) })}
      </p>

      <div className="pager__controls">
        <button type="button" className="pager__step" disabled={page <= 1} onClick={() => go(page - 1)}>
          <Icon name="arrow" size={15} className="pager__back" />
          <span>{t('pager.prev')}</span>
        </button>

        <ol className="pager__pages">
          {pageWindow(page, count).map((item, i) =>
            item === 'gap' ? (
              <li key={`gap-${i}`} className="pager__gap" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className="pager__page"
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={t('pager.page', { n: formatCount(item, lang) })}
                  onClick={() => go(item)}
                >
                  {formatCount(item, lang)}
                </button>
              </li>
            ),
          )}
        </ol>

        <p className="pager__compact" aria-hidden="true">
          {t('pager.compact', { page: formatCount(page, lang), count: formatCount(count, lang) })}
        </p>

        <button type="button" className="pager__step" disabled={page >= count} onClick={() => go(page + 1)}>
          <span>{t('pager.next')}</span>
          <Icon name="arrow" size={15} />
        </button>
      </div>
    </nav>
  )
}
