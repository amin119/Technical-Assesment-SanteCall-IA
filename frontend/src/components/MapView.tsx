import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { GeoPoint } from '../api/types'
import { NEAR_RADIUS_KM } from '../lib/filters'

const PARIS: [number, number] = [48.8566, 2.3522]
const INK = '#17140f'
const ACCENT = '#e0452b'

interface Props {
  points: GeoPoint[]
  selectedId: string | null
  hoveredId: string | null
  near: { lat: number; lon: number } | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

/** Moves the camera when the selection or the "around me" position changes. */
function Camera({ target, near }: { target: GeoPoint | undefined; near: Props['near'] }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 14), { duration: 0.6 })
  }, [map, target])
  useEffect(() => {
    if (near) map.flyTo([near.lat, near.lon], 14, { duration: 0.8 })
  }, [map, near])
  return null
}

export default function MapView({ points, selectedId, hoveredId, near, onSelect, onHover }: Props) {
  const active = useMemo(() => points.find((p) => p.id === selectedId), [points, selectedId])
  const hovered = useMemo(() => points.find((p) => p.id === hoveredId), [points, hoveredId])

  return (
    <MapContainer center={PARIS} zoom={12} preferCanvas zoomControl={false} className="map" attributionControl>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <Camera target={active} near={near} />
      {near && (
        <Circle
          center={[near.lat, near.lon]}
          radius={NEAR_RADIUS_KM * 1000}
          pathOptions={{ color: ACCENT, weight: 1, dashArray: '4 6', fillOpacity: 0.04 }}
          interactive={false}
        />
      )}
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lon]}
          radius={4}
          pathOptions={{ color: INK, weight: 0, fillColor: INK, fillOpacity: 0.55 }}
          eventHandlers={{ click: () => onSelect(p.id), mouseover: () => onHover(p.id), mouseout: () => onHover(null) }}
        />
      ))}
      {/* Highlighted markers are drawn last so they sit on top of the crowd. */}
      {[hovered, active].map(
        (p, i) =>
          p && (
            <CircleMarker
              key={`${i}-${p.id}`}
              center={[p.lat, p.lon]}
              radius={i === 1 ? 9 : 7}
              pathOptions={{ color: '#f4f0e8', weight: 2, fillColor: ACCENT, fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect(p.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={i === 1}>
                {p.title}
              </Tooltip>
            </CircleMarker>
          ),
      )}
    </MapContainer>
  )
}
