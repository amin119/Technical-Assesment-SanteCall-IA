import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createTranslator, detectLang, type Lang } from './translator'
import { I18nContext, type I18n } from './useI18n'

const STORAGE_KEY = 'sortir.lang'

// localStorage can throw (private mode, blocked cookies). Language still works without it.
const readStored = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    detectLang(window.location.search, readStored(), navigator.languages ?? [navigator.language]),
  )

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore: the choice just won't survive a reload
    }
  }, [])

  const value = useMemo<I18n>(() => ({ ...createTranslator(lang), setLang }), [lang, setLang])

  // Keep the document in step with the language: screen readers, hyphenation, tab title.
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = value.t('meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', value.t('meta.description'))
  }, [lang, value])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
