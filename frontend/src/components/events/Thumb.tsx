import { useState } from 'react'
import { Icon } from '../ui/Icon'
import './thumb.css'

/** Cover image with a quiet placeholder when there is none, or when it fails to load. */
export function Thumb({ src, className = '' }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`thumb ${className}`.trim()}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <Icon name="image" size={28} className="thumb__empty" />
      )}
    </div>
  )
}
