import { BRAND } from '@/shared/seo/brand'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { BrandLogo } from '@/shared/components/BrandMark/BrandMark'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.brand}>
          <Link to="/" aria-label="Resume Builder home">
            <BrandLogo />
          </Link>
          <p>{BRAND.tagline}</p>
        </div>
        <nav className={styles.nav} aria-label="Footer">
          <Link to="/templates">
            Resume templates <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
          <Link to="/guides">
            Resume guides <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
          <Link to="/settings">
            Settings <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Resume Builder</p>
        <span>Create confidently. Keep your data.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}
