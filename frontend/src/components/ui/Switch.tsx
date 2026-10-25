import type { ReactNode } from 'react'

interface Props {
  label: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  /** Small extra info after the label, for example the search radius. */
  hint?: ReactNode
}

export function Switch({ label, checked, onChange, disabled, hint }: Props) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="switch__track" aria-hidden="true" />
      <span className="switch__label">{label}</span>
      {hint}
    </label>
  )
}
