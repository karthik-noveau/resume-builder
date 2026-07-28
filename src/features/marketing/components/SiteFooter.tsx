import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'
import styles from './SiteFooter.module.css'

const FOOTER_LINKS = [
  { to: '/app', label: 'My Resumes' },
  { to: '/templates', label: 'Templates' },
  { to: '/settings', label: 'Settings' },
]

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Sparkles size={16} className={styles.iconPrimary} aria-hidden="true" />
          Resume Studio
        </div>
        <nav className={styles.nav} aria-label="Footer">
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={styles.navLink}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className={styles.tagline}>Your resumes stay on your device.</p>
      </div>
    </footer>
  )
}
