import type { CategoryCount } from '../../api/types'
import { useI18n } from '../../i18n/useI18n'
import { NEAR_RADIUS_KM, type Filters } from '../../lib/filters'
import { Badge } from '../ui/Badge'
import { Switch } from '../ui/Switch'
import { CategoryFilter } from './CategoryFilter'
import { SearchBox } from './SearchBox'
import { WhenFilter } from './WhenFilter'
import './filters.css'

interface Props {
  filters: Filters
  categories: CategoryCount[] | undefined
  canReset: boolean
  locating: boolean
  geoError: boolean
  onChange: (patch: Partial<Filters>, replace?: boolean) => void
  onLocate: () => void
  onReset: () => void
}

export function FilterBar({ filters, categories, canReset, locating, geoError, onChange, onLocate, onReset }: Props) {
  const { t } = useI18n()
  return (
    <section className="filters shell" aria-label={t('filters.label')}>
      <div className="filters__row">
        <SearchBox value={filters.q} onSearch={(q) => onChange({ q }, true)} />
        <WhenFilter value={filters.when} onChange={(when) => onChange({ when })} />
      </div>

      <div className="filters__row">
        <CategoryFilter categories={categories} selected={filters.categories} onChange={(c) => onChange({ categories: c })} />

        <div className="filters__toggles">
          <Switch label={t('filters.free')} checked={filters.free} onChange={() => onChange({ free: !filters.free })} />
          <Switch
            label={locating ? t('filters.locating') : t('filters.near')}
            checked={filters.near !== null}
            onChange={onLocate}
            disabled={locating}
            hint={<Badge tone="brand">{NEAR_RADIUS_KM} km</Badge>}
          />
          {canReset && (
            <button type="button" className="filters__reset" onClick={onReset}>
              {t('filters.reset')}
            </button>
          )}
        </div>
      </div>

      {geoError && (
        <p className="filters__note" role="status">
          {t('filters.geoError')}
        </p>
      )}
    </section>
  )
}
