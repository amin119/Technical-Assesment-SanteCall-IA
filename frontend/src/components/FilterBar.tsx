import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { CategoryCount } from '../api/types'
import { WHEN_OPTIONS, type Filters } from '../lib/filters'
import { formatCount } from '../lib/format'

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
  // The input keeps its own text and reports it 300 ms after the last keystroke,
  // so typing does not fire one request per letter.
  const [text, setText] = useState(filters.q)
  const [seenQ, setSeenQ] = useState(filters.q)
  if (filters.q !== seenQ) {
    // The URL changed from outside (reset button, back button): follow it.
    setSeenQ(filters.q)
    setText(filters.q)
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latestOnChange = useRef(onChange)
  useEffect(() => {
    latestOnChange.current = onChange
  })
  useEffect(() => () => clearTimeout(timer.current), [])

  const onType = (value: string) => {
    setText(value)
    clearTimeout(timer.current)
    // Read the latest handler when the timer fires, not the one from this keystroke.
    timer.current = setTimeout(() => latestOnChange.current({ q: value }, true), 300)
  }

  const toggleCategory = (slug: string) => {
    const has = filters.categories.includes(slug)
    onChange({ categories: has ? filters.categories.filter((c) => c !== slug) : [...filters.categories, slug] })
  }

  return (
    <div className="filters">
      <div className="filters__row">
        <label className="search">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="sr-only">Rechercher un événement</span>
          <input
            type="search"
            value={text}
            onChange={(e) => onType(e.target.value)}
            placeholder="Un artiste, un lieu, un mot…"
          />
        </label>

        <div className="when" role="group" aria-label="Quand">
          {WHEN_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="when__tab"
              aria-pressed={filters.when === o.value}
              onClick={() => onChange({ when: o.value })}
            >
              {o.label}
              {filters.when === o.value && (
                <motion.span
                  layoutId="when-underline"
                  className="when__line"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__row filters__row--wrap">
        <div className="cats" role="group" aria-label="Catégories">
          {categories?.map((c) => {
            const active = filters.categories.includes(c.slug)
            return (
              <button
                key={c.slug}
                type="button"
                className="cat"
                aria-pressed={active}
                disabled={!active && c.count === 0}
                onClick={() => toggleCategory(c.slug)}
              >
                {c.label}
                <sup>{formatCount(c.count)}</sup>
              </button>
            )
          })}
        </div>

        <div className="toggles">
          <button type="button" className="toggle" aria-pressed={filters.free} onClick={() => onChange({ free: !filters.free })}>
            Gratuit
          </button>
          <button type="button" className="toggle" aria-pressed={filters.near !== null} onClick={onLocate} disabled={locating}>
            {locating ? 'Localisation…' : 'Autour de moi'}
          </button>
          {canReset && (
            <button type="button" className="toggle toggle--link" onClick={onReset}>
              Effacer
            </button>
          )}
        </div>
      </div>
      {geoError && (
        <p className="filters__note" role="status">
          Position indisponible. Autorisez la localisation dans votre navigateur.
        </p>
      )}
    </div>
  )
}
