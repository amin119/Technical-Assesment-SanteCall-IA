import { useState } from 'react'
import { Icon } from '../ui/Icon'
import './thumb.css'

/** Cover image with a quiet placeholder when there is none, or when it fails to load. `eager` for images above the fold. */
export function Thumb({ src, className = '', eager = false }: { src: string | null; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`thumb ${className}`.trim()}>
      {src && !failed ? (
        <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
      ) : (
        <Icon name="image" size={28} className="thumb__empty" />
      )}
    </div>
  )
}
