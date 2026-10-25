import { useI18n } from '../../i18n/useI18n'
import './layout.css'

const LINKS = {
  data: 'https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/',
  map: 'https://www.openstreetmap.org/copyright',
  code: 'https://github.com/amin119/Technical-Assesment-SanteCall-IA',
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="footer">
      <div className="footer__grid shell">
        <div className="footer__brand">
          <span className="footer__name">Sortir</span>
          <p>{t('footer.tagline')}</p>
        </div>

        <div className="footer__col">
          <h2>{t('footer.dataTitle')}</h2>
          <ul>
            <li>
              <ExternalLink href={LINKS.data}>{t('footer.dataSource')}</ExternalLink>
            </li>
            <li>
              <ExternalLink href={LINKS.map}>{t('footer.mapSource')}</ExternalLink>
            </li>
            <li>{t('footer.frenchText')}</li>
          </ul>
        </div>

        <div className="footer__col">
          <h2>{t('footer.demoTitle')}</h2>
          <p>{t('footer.demoNote')}</p>
          <ExternalLink href={LINKS.code}>{t('footer.code')}</ExternalLink>
        </div>
      </div>
    </footer>
  )
}
