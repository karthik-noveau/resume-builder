import { Check, Moon, Palette, Sun } from 'lucide-react'
import { clsx } from 'clsx'
import { PageLayout } from '@/shared/components/layout/PageLayout'
import { Seo } from '@/shared/components/Seo/Seo'
import { useThemeStore } from '@/shared/stores/theme.store'
import { DataBackup } from '../components/DataBackup'
import styles from './Settings.module.css'

export function Settings() {
  const activeThemeId = useThemeStore((s) => s.activeThemeId)
  const switchTheme = useThemeStore((s) => s.switchTheme)

  return (
    <PageLayout>
      <Seo title="Settings" description="Choose your theme and manage resume backups." noindex />
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.heading}>Settings</h1>
          <p className={styles.subheading}>Choose your theme and manage backups.</p>
        </header>

        <div className={styles.content}>
          <section className={styles.appearance} aria-labelledby="appearance-heading">
            <div className={styles.panelHeader}>
              <span className={styles.sectionIcon}>
                <Palette size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="appearance-heading">Theme</h2>
                <p>Choose how Resume Studio looks.</p>
              </div>
            </div>
            <fieldset className={styles.themeOptions}>
              <legend className={styles.srOnly}>Interface theme</legend>
              {[
                { id: 'light', name: 'Light', icon: Sun },
                { id: 'dark', name: 'Dark', icon: Moon },
              ].map(({ id, name, icon: Icon }) => (
                <label
                  key={id}
                  className={clsx(styles.themeOption, activeThemeId === id && styles.optionSelected)}
                >
                  <input
                    className={styles.radio}
                    type="radio"
                    name="interface-theme"
                    aria-label={name}
                    checked={activeThemeId === id}
                    onChange={() => switchTheme(id)}
                  />
                  <Icon size={18} aria-hidden="true" /> {name}
                  <Check size={14} aria-hidden="true" className={styles.selectedCheck} />
                </label>
              ))}
            </fieldset>
          </section>
          <DataBackup />
        </div>
      </div>
    </PageLayout>
  )
}

export default Settings
