import { useI18n } from '../i18n/useI18n'
import { LANGS } from '../i18n/translator'

/** FR | EN. Plain text, no flags: a flag is a country, not a language. */
export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="lang" role="group" aria-label={t('lang.label')}>
      {LANGS.map((code, i) => (
        <span key={code} className="lang__item">
          {i > 0 && <span className="lang__sep" aria-hidden="true" />}
          <button
            type="button"
            className="lang__btn"
            lang={code}
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
