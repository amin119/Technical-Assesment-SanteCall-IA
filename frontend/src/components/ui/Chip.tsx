import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface Props {
  pressed: boolean
  count?: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

/** A toggle pill. Pressed chips show a close icon: clicking again removes the filter. */
export function Chip({ pressed, count, disabled, onClick, children }: Props) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      {children}
      {count !== undefined && <span className="chip__count">{count}</span>}
      {pressed && <Icon name="close" size={13} />}
    </button>
  )
}
