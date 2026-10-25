import { useState } from 'react'

type Position = { lat: number; lon: number }

/** "Near me": toggles off when already on, otherwise asks the browser for the position. */
export function useLocate(current: Position | null, onChange: (near: Position | null) => void) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState(false)

  const locate = () => {
    setError(false)
    if (current) return onChange(null)
    if (!navigator.geolocation) return setError(true)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onChange({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {
        setLocating(false)
        setError(true)
      },
      { timeout: 10_000 },
    )
  }

  return { locating, error, locate }
}
