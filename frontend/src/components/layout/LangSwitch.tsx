import { LANGS, type Lang } from '../../i18n/translator'
import { useI18n } from '../../i18n/useI18n'
import { Segmented } from '../ui/Segmented'

/** FR | EN. Plain text, no flags: a flag is a country, not a language. */
export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <Segmented<Lang>
      tone="quiet"
      label={t('lang.label')}
      value={lang}
      onChange={setLang}
      options={LANGS.map((code) => ({ value: code, label: code.toUpperCase(), lang: code }))}
    />
  )
}
