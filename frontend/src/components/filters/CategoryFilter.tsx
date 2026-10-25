import type { CategoryCount } from '../../api/types'
import { useI18n } from '../../i18n/useI18n'
import { categoryLabel, formatCount } from '../../lib/format'
import { Chip } from '../ui/Chip'

interface Props {
  categories: CategoryCount[] | undefined
  selected: string[]
  onChange: (selected: string[]) => void
}

/** Multi-select categories with live counts. An empty category cannot be added, but can be removed. */
export function CategoryFilter({ categories, selected, onChange }: Props) {
  const i18n = useI18n()
  const toggle = (slug: string) =>
    onChange(selected.includes(slug) ? selected.filter((c) => c !== slug) : [...selected, slug])

  return (
    <div className="cats" role="group" aria-label={i18n.t('filters.categories')}>
      {categories?.map((c) => {
        const active = selected.includes(c.slug)
        return (
          <Chip
            key={c.slug}
            pressed={active}
            count={formatCount(c.count, i18n.lang)}
            disabled={!active && c.count === 0}
            onClick={() => toggle(c.slug)}
          >
            {categoryLabel(c.slug, c.label, i18n)}
          </Chip>
        )
      })}
    </div>
  )
}
