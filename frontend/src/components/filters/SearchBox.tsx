import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { Icon } from '../ui/Icon'

interface Props {
  value: string
  onSearch: (value: string) => void
}

/**
 * The input keeps its own text and reports it 300 ms after the last keystroke,
 * so typing does not fire one request per letter.
 */
export function SearchBox({ value, onSearch }: Props) {
  const { t } = useI18n()
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    // The URL changed from outside (reset button, back button): follow it.
    setSeen(value)
    setText(value)
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef(onSearch)
  useEffect(() => {
    latest.current = onSearch
  })
  useEffect(() => () => clearTimeout(timer.current), [])

  const onType = (next: string) => {
    setText(next)
    clearTimeout(timer.current)
    // Read the latest handler when the timer fires, not the one from this keystroke.
    timer.current = setTimeout(() => latest.current(next), 300)
  }

  return (
    <label className="search">
      <Icon name="search" size={19} />
      <span className="sr-only">{t('filters.searchLabel')}</span>
      <input type="search" value={text} onChange={(e) => onType(e.target.value)} placeholder={t('filters.searchPlaceholder')} />
    </label>
  )
}
