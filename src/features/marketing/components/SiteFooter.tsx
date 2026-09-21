import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { BrandLogo } from '@/shared/components/BrandMark/BrandMark'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.brand}>
          <Link to="/" aria-label="Resume Studio home">
            <BrandLogo />
          </Link>
          <p>Built for your next move.</p>
        </div>
        <nav className={styles.nav} aria-label="Footer">
          <Link to="/templates">
            The templates <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
          <Link to="/app">
            My resumes <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
          <Link to="/settings">
            Settings <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Resume Studio</p>
        <span>Create confidently. Keep your data.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}
