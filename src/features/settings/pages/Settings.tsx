import { useEffect, useState, type ComponentType, type CSSProperties } from 'react'
import { toast } from 'sonner'
import { Palette, Type, FileText, SunMoon } from 'lucide-react'
import { clsx } from 'clsx'
import { PageLayout } from '@/shared/components/layout/PageLayout'
import { Select } from '@/shared/components/ui/Select/Select'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { storageService } from '@/shared/services/storage.service'
import { AVAILABLE_THEMES, AVAILABLE_FONT_PRESETS, useThemeStore } from '@/shared/stores/theme.store'
import type { AppSettings } from '@/shared/types/resume.types'
import styles from './Settings.module.css'

function SettingRow({
  icon: Icon,
  caption,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  caption: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowIcon}>
        <Icon size={18} />
      </div>
      <div className={styles.rowBody}>
        {children}
        <p className={styles.rowCaption}>{caption}</p>
      </div>
    </div>
  )
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const activeThemeId = useThemeStore((s) => s.activeThemeId)
  const switchTheme = useThemeStore((s) => s.switchTheme)

  useEffect(() => {
    void storageService.getSettings().then(setSettings)
  }, [])

  const updateField = async (patch: Partial<AppSettings>) => {
    if (!settings) return
    const updated = { ...settings, ...patch, updatedAt: new Date().toISOString() }
    setSettings(updated)
    try {
      await storageService.saveSettings(updated)
    } catch {
      toast.error('Failed to save settings')
    }
  }

  if (!settings) {
    return (
      <PageLayout>
        <div className={styles.loadingWrap}>
          <Spinner size={28} label="Loading settings…" />
        </div>
      </PageLayout>
    )
  }

  const selectedResumeTheme = AVAILABLE_THEMES.find((theme) => theme.id === settings.themeId)
  const selectedFontPreset = AVAILABLE_FONT_PRESETS.find((preset) => preset.id === settings.fontPresetId)
  const previewAccent = selectedResumeTheme?.colors.primary

  return (
    <PageLayout>
      <div className={styles.page}>
        <h1 className={styles.heading}>Settings</h1>
        <p className={styles.subheading}>
          Defaults applied to every new resume you create.
        </p>

        <div className={styles.layout}>
          <div>
            <h2 className={styles.sectionTitle}>Resume Defaults</h2>
            <div className={clsx(styles.panel, styles.panelDivided)}>
              <SettingRow icon={Palette} caption="Applied automatically when you start a new resume.">
                <Select
                  label="Default color theme"
                  value={settings.themeId}
                  onChange={(e) => { void updateField({ themeId: e.target.value }) }}
                  options={AVAILABLE_THEMES.map((theme) => ({ value: theme.id, label: theme.name }))}
                />
              </SettingRow>
              <SettingRow icon={Type} caption="Controls headings, body text, and spacing rhythm.">
                <Select
                  label="Default font family"
                  value={settings.fontPresetId}
                  onChange={(e) => { void updateField({ fontPresetId: e.target.value }) }}
                  options={AVAILABLE_FONT_PRESETS.map((preset) => ({ value: preset.id, label: preset.name }))}
                />
              </SettingRow>
              <SettingRow icon={FileText} caption="Match the paper size your target region expects.">
                <Select
                  label="Default page size"
                  value={settings.pageSize}
                  onChange={(e) => { void updateField({ pageSize: e.target.value as 'A4' | 'LETTER' }) }}
                  options={[
                    { value: 'A4', label: 'A4 (210 × 297mm)' },
                    { value: 'LETTER', label: 'Letter (8.5 × 11in)' },
                  ]}
                />
              </SettingRow>
            </div>

            <h2 className={styles.sectionTitle}>Appearance</h2>
            <div className={styles.panel}>
              <SettingRow icon={SunMoon} caption="Applies across the whole app, independent of resume color presets.">
                <div className={styles.themeRow}>
                  <p className={styles.themeLabel}>Interface theme</p>
                  <div className={styles.themeToggle} role="radiogroup" aria-label="Interface theme">
                    {AVAILABLE_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        role="radio"
                        aria-checked={activeThemeId === theme.id}
                        onClick={() => switchTheme(theme.id)}
                        className={clsx(
                          styles.themeOption,
                          activeThemeId === theme.id && styles.themeOptionActive
                        )}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>
              </SettingRow>
            </div>
          </div>

          <aside className={styles.aside} aria-hidden="true">
            <div
              className={styles.previewCard}
              style={{ '--preview-accent': previewAccent } as CSSProperties}
            >
              <p className={styles.previewLabel}>Preview</p>
              <div className={clsx(styles.previewLine, styles.previewLineAccent)} style={{ width: '55%', height: 14 }} />
              <div className={styles.previewLine} style={{ width: '85%' }} />
              <div className={styles.previewLine} style={{ width: '70%' }} />
              <div className={styles.previewLine} style={{ width: '90%' }} />
              <div className={clsx(styles.previewLine, styles.previewLineAccent)} style={{ width: '40%', marginTop: 20 }} />
              <div className={styles.previewLine} style={{ width: '75%' }} />
              <div className={styles.previewLine} style={{ width: '60%' }} />
              <p className={styles.previewCaption}>
                This is how your default color theme ({selectedResumeTheme?.name ?? 'Light'}) and
                font ({selectedFontPreset?.name ?? 'Professional'}) will look on a new resume.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageLayout>
  )
}

export default Settings
