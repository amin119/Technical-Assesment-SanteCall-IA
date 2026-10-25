import { lazy, Suspense } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { formatCount } from '../../lib/format'
import { Icon } from '../ui/Icon'
import type { MapProps } from './MapView'
import './map.css'

// Leaflet is heavy and only needed once the page is up: load it in a separate chunk.
const MapView = lazy(() => import('./MapView'))

/** The map card: a small title bar (what you see, and how many places) around the lazy-loaded map. */
export function MapPanel(props: MapProps) {
  const { t, tp, lang } = useI18n()
  return (
    <aside className="mappanel" aria-label={t('map.label')}>
      <header className="mappanel__bar">
        <span className="mappanel__title">
          <Icon name="map" size={17} />
          {t('map.label')}
        </span>
        <span className="mappanel__count">{tp('map.places', props.points.length, { n: formatCount(props.points.length, lang) })}</span>
      </header>
      <div className="mappanel__body">
        <Suspense fallback={<div className="map skeleton" />}>
          <MapView {...props} />
        </Suspense>
      </div>
    </aside>
  )
}
