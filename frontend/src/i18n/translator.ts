import { en, fr, type MessageKey } from './messages'

export type Lang = 'fr' | 'en'
export const LANGS: Lang[] = ['fr', 'en']

/** Browser locale used for dates, numbers and plural rules. English uses en-GB (day before month, like Paris). */
export const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' }

const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { fr, en }

/** `seats.few` is a plural base when both `seats.few_one` and `seats.few_other` exist. */
export type PluralBase = MessageKey extends infer K ? (K extends `${infer B}_one` ? B : never) : never

type Vars = Record<string, string | number>

export interface Translator {
  lang: Lang
  /** Look up a message and fill its {placeholders}. */
  t: (key: MessageKey, vars?: Vars) => string
  /** Pick the singular/plural form for `n` in the current language, then fill {n} and any vars. */
  tp: (base: PluralBase, n: number, vars?: Vars) => string
  /** True if a message exists. Lets callers fall back for keys built from server data (categories). */
  has: (key: string) => key is MessageKey
}

const fill = (template: string, vars?: Vars) =>
  vars ? template.replace(/\{(\w+)\}/g, (match, name: string) => String(vars[name] ?? match)) : template

/** Pure and framework-free, so it is easy to test. React gets it through I18nProvider. */
export function createTranslator(lang: Lang): Translator {
  const dictionary = DICTIONARIES[lang]
  const plural = new Intl.PluralRules(LOCALES[lang])
  const has = (key: string): key is MessageKey => key in dictionary
  return {
    lang,
    has,
    t: (key, vars) => fill(dictionary[key], vars),
    tp: (base, n, vars) => {
      // French: 0 and 1 are "one". English: only 1. Intl.PluralRules knows.
      const form = plural.select(n) === 'one' ? 'one' : 'other'
      return fill(dictionary[`${base}_${form}` as MessageKey], { n, ...vars })
    },
  }
}

/** Pick the starting language: ?lang= in the URL, then the saved choice, then the browser. */
export function detectLang(search: string, stored: string | null, browserLanguages: readonly string[]): Lang {
  const fromUrl = new URLSearchParams(search).get('lang')
  for (const candidate of [fromUrl, stored]) {
    if (candidate === 'fr' || candidate === 'en') return candidate
  }
  return browserLanguages.some((l) => l.toLowerCase().startsWith('fr')) ? 'fr' : 'en'
}
