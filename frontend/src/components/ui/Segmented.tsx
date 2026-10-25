import { motion } from 'motion/react'
import { useId } from 'react'

interface Option<T extends string> {
  value: T
  label: string
  lang?: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** `solid` for the main filter, `quiet` for small switches such as the language. */
  tone?: 'solid' | 'quiet'
}

/** Single-choice control. The highlight slides between options (shared layout animation). */
export function Segmented<T extends string>({ options, value, onChange, label, tone = 'solid' }: Props<T>) {
  const id = useId()
  return (
    <div className={`segmented segmented--${tone}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="segmented__option"
          lang={o.lang}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {value === o.value && (
            <motion.span
              layoutId={id}
              className="segmented__thumb"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          <span className="segmented__label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
