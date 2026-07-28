import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { Button } from 'antd'
import { Home, FileText, LayoutTemplate, Settings as SettingsIcon, Sun, Moon, Menu } from 'lucide-react'
import { clsx } from 'clsx'
import { useThemeStore } from '@/shared/stores/theme.store'
import { Drawer } from '@/shared/components/ui/Drawer/Drawer'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/app', label: 'My Resumes', Icon: FileText, end: false },
  { to: '/templates', label: 'Templates', Icon: LayoutTemplate, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
]

export function AppShell() {
  const activeThemeId = useThemeStore((s) => s.activeThemeId)
  const switchTheme = useThemeStore((s) => s.switchTheme)
  const isDark = activeThemeId === 'dark'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.leftGroup}>
            <NavLink to="/" className={styles.brand}>
              <BrandMark size="sm" />
              Resume Studio
            </NavLink>
            <nav className={styles.desktopNav} aria-label="Main">
              {NAV_ITEMS.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => clsx(styles.navLink, isActive && styles.navLinkActive)}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className={styles.rightGroup}>
            <Button
              type="text"
              shape="circle"
              onClick={() => { switchTheme(isDark ? 'light' : 'dark') }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDark}
              icon={isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            />

            <Button
              type="text"
              shape="circle"
              className={styles.mobileMenuButton}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              icon={<Menu size={18} aria-hidden="true" />}
            />
          </div>
        </div>
      </header>

      <Drawer isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} position="left" title="Menu" width="260px">
        <nav className={styles.mobileNav} aria-label="Main">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => clsx(styles.mobileNavLink, isActive && styles.mobileNavLinkActive)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </Drawer>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
