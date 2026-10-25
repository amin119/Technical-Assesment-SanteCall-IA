import { useI18n } from '../../i18n/useI18n'
import { Badge } from '../ui/Badge'
import { LangSwitch } from './LangSwitch'
import './layout.css'

export function Header() {
  const { t } = useI18n()
  return (
    <header className="header">
      <div className="header__inner shell">
        <a className="wordmark" href="/" aria-label={t('brand.home')}>
          <span className="wordmark__name">Sortir</span>
          <Badge tone="brand">Paris</Badge>
        </a>
        <LangSwitch />
      </div>
    </header>
  )
}
