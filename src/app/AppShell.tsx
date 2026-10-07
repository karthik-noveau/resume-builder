import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { Button } from 'antd'
import {
  Home,
  FileText,
  LayoutTemplate,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Menu,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useThemeStore } from '@/shared/stores/theme.store'
import { Drawer } from '@/shared/components/ui/Drawer/Drawer'
import { BrandLogo } from '@/shared/components/BrandMark/BrandMark'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/app', label: 'My Resumes', Icon: FileText, end: false },
  { to: '/templates', label: 'Templates', Icon: LayoutTemplate, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
]

export function AppShell() {
  const { pathname, hash } = useLocation()
  const activeThemeId = useThemeStore((s) => s.activeThemeId)
  const switchTheme = useThemeStore((s) => s.switchTheme)
  const isDark = activeThemeId === 'dark'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  useEffect(() => {
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className={clsx(styles.root, pathname === '/' && styles.home)}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.leftGroup}>
            <NavLink to="/" className={styles.brand}>
              <BrandLogo />
            </NavLink>
            <nav className={styles.desktopNav} aria-label="Main">
              {NAV_ITEMS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(styles.navLink, isActive && styles.navLinkActive)
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className={styles.rightGroup}>
            <NavLink to="/templates?create=true" className={styles.startLink}>
              Let’s get started <span aria-hidden="true">↗</span>
            </NavLink>
            <Button
              type="text"
              shape="circle"
              onClick={() => {
                switchTheme(isDark ? 'light' : 'dark')
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDark}
              icon={
                isDark ? (
                  <Sun size={16} aria-hidden="true" />
                ) : (
                  <Moon size={16} aria-hidden="true" />
                )
              }
            />

            <Button
              type="text"
              shape="circle"
              className={styles.mobileMenuButton}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              aria-haspopup="dialog"
              icon={<Menu size={18} aria-hidden="true" />}
            />
          </div>
        </div>
      </header>

      <Drawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        position="left"
        title={
          <>
            <span aria-hidden="true"><BrandLogo /></span>
            <span className={styles.menuTitle}>Menu</span>
          </>
        }
        width="320px"
        rootClassName={styles.mobileMenu}
      >
        <nav className={styles.mobileNav} aria-label="Main">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                clsx(styles.mobileNavLink, isActive && styles.mobileNavLinkActive)
              }
            >
              <span className={styles.mobileNavIcon}><Icon size={19} aria-hidden="true" /></span>
              <span>{label}</span>
              <ChevronRight className={styles.mobileNavArrow} size={17} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
        <div className={styles.mobileMenuFooter}>
          <button
            type="button"
            className={styles.mobileThemeToggle}
            role="switch"
            aria-label="Dark mode"
            aria-checked={isDark}
            onClick={() => switchTheme(isDark ? 'light' : 'dark')}
          >
            <Moon size={18} aria-hidden="true" />
            <span>Dark mode</span>
            <span className={styles.mobileThemeSwitch} aria-hidden="true" />
          </button>
          <NavLink
            to="/templates?create=true"
            className={styles.mobileCreateLink}
            onClick={() => setMobileNavOpen(false)}
          >
            Create a resume <ArrowUpRight size={19} aria-hidden="true" />
          </NavLink>
        </div>
      </Drawer>

      <div id="main-content" tabIndex={-1} className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
