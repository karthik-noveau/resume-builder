import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Check,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Moon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
} from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { PageLayout } from '@/shared/components/layout/PageLayout'
import { Seo } from '@/shared/components/Seo/Seo'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { storageService } from '@/shared/services/storage.service'
import { AVAILABLE_FONT_PRESETS, CUSTOM_THEME_ID, useThemeStore } from '@/shared/stores/theme.store'
import type { AppSettings } from '@/shared/types/resume.types'
import { buildSettingsPreview } from '../utils/settingsPreview'
import styles from './Settings.module.css'
import { DataBackup } from '../components/DataBackup'

const ACCENTS = [
  { name: 'Violet', color: '#7a45d1' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Teal', color: '#167d72' },
  { name: 'Rose', color: '#b84368' },
  { name: 'Slate', color: '#475569' },
]
const FONT_DETAILS: Record<string, string> = {
  professional: 'The template’s own typography',
  executive: 'Source Serif · Classic & composed',
  modern: 'Manrope · Bold & contemporary',
  minimal: 'IBM Plex Sans · Clean & understated',
}
const PAPER_SIZES = [
  { id: 'A4', name: 'A4', dimensions: '210 × 297 mm', ratio: '210 / 297' },
  { id: 'LETTER', name: 'US Letter', dimensions: '8.5 × 11 in', ratio: '8.5 / 11' },
] as const
const PREVIEW_TEMPLATES = [
  { id: 'experienced-icon-minimal', name: 'Clarity' },
  { id: 'meridian', name: 'Meridian' },
  { id: 'atlas', name: 'Atlas' },
]

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [previewTemplate, setPreviewTemplate] = useState(PREVIEW_TEMPLATES[0].id)
  const [previewWidth, setPreviewWidth] = useState(340)
  const previewStage = useRef<HTMLDivElement>(null)
  const latestSettings = useRef<AppSettings | null>(null)
  const savedSettings = useRef<AppSettings | null>(null)
  const saveQueue = useRef(Promise.resolve())
  const saveVersion = useRef(0)
  const activeThemeId = useThemeStore((s) => s.activeThemeId)
  const switchTheme = useThemeStore((s) => s.switchTheme)

  useEffect(() => {
    let active = true
    void storageService.getSettings().then((loaded) => {
      if (!active) return
      latestSettings.current = loaded
      savedSettings.current = loaded
      setSettings(loaded)
    })
    return () => {
      active = false
    }
  }, [])

  const loaded = settings !== null
  useEffect(() => {
    const stage = previewStage.current
    if (!stage) return
    const resize = () => setPreviewWidth(Math.min(340, Math.max(160, stage.clientWidth - 48)))
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [loaded])

  const layoutTree = useMemo(
    () => (settings ? buildSettingsPreview(settings, previewTemplate) : null),
    [settings, previewTemplate]
  )

  const updateField = (patch: Partial<AppSettings>) => {
    if (!latestSettings.current) return
    const updated = { ...latestSettings.current, ...patch, updatedAt: new Date().toISOString() }
    latestSettings.current = updated
    setSettings(updated)
    setSaveStatus('saving')
    const version = ++saveVersion.current
    // Keep rapid choices in order, and only let the latest save update the status.
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        await storageService.saveSettings(updated)
        savedSettings.current = updated
        if (version === saveVersion.current) setSaveStatus('saved')
      } catch {
        if (version === saveVersion.current) {
          latestSettings.current = savedSettings.current
          setSettings(savedSettings.current)
          setSaveStatus('error')
        }
        toast.error('Could not save this change. Please try again.')
      }
    })
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

  const customAccent = settings.themeId === CUSTOM_THEME_ID
  const accentName = customAccent
    ? (ACCENTS.find((accent) => accent.color === settings.customPrimaryColor)?.name ?? 'Custom')
    : 'Template colors'
  const accentChoices =
    customAccent &&
    settings.customPrimaryColor &&
    !ACCENTS.some((accent) => accent.color === settings.customPrimaryColor)
      ? [...ACCENTS, { name: 'Custom', color: settings.customPrimaryColor }]
      : ACCENTS
  const selectedFont =
    AVAILABLE_FONT_PRESETS.find((font) => font.id === settings.fontPresetId) ??
    AVAILABLE_FONT_PRESETS[0]
  const statusText = {
    idle: 'Changes save automatically',
    saving: 'Saving changes…',
    saved: 'Saved on this device',
    error: 'Change wasn’t saved. Try again.',
  }[saveStatus]

  return (
    <PageLayout>
      <Seo title="Settings" description="Make Resume Studio your own." noindex />
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Settings</h1>
            <p className={styles.subheading}>A few preferences. A better starting point.</p>
          </div>
          <p
            className={clsx(styles.saveStatus, saveStatus === 'error' && styles.saveError)}
            role="status"
          >
            {saveStatus === 'saving' ? (
              <LoaderCircle size={15} className={styles.saving} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={15} aria-hidden="true" />
            )}
            {statusText}
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.controls}>
            <section className={styles.panel} aria-labelledby="defaults-heading">
              <div className={styles.panelHeader}>
                <span className={styles.sectionIcon}>
                  <SlidersHorizontal size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="defaults-heading">Resume defaults</h2>
                  <p>Applied to new resumes. Make each one your own in the editor.</p>
                </div>
              </div>

              <fieldset className={styles.setting}>
                <legend>
                  Accent color <span>{accentName}</span>
                </legend>
                <div className={styles.colorOptions}>
                  <label
                    className={clsx(
                      styles.templateColor,
                      !customAccent && styles.templateColorSelected
                    )}
                  >
                    <input
                      className={styles.radio}
                      type="radio"
                      name="resume-accent"
                      checked={!customAccent}
                      onChange={() =>
                        updateField({ themeId: 'light', customPrimaryColor: undefined })
                      }
                    />
                    <Palette size={17} aria-hidden="true" /> Template colors
                    {!customAccent && <Check size={14} aria-hidden="true" />}
                  </label>
                  {accentChoices.map((accent) => (
                    <label
                      key={accent.color}
                      title={accent.name}
                      className={clsx(
                        styles.swatch,
                        customAccent &&
                          settings.customPrimaryColor === accent.color &&
                          styles.swatchSelected
                      )}
                      style={{ '--swatch': accent.color } as CSSProperties}
                    >
                      <input
                        className={styles.radio}
                        type="radio"
                        name="resume-accent"
                        aria-label={accent.name}
                        checked={customAccent && settings.customPrimaryColor === accent.color}
                        onChange={() =>
                          updateField({
                            themeId: CUSTOM_THEME_ID,
                            customPrimaryColor: accent.color,
                          })
                        }
                      />
                      {customAccent && settings.customPrimaryColor === accent.color && (
                        <Check size={17} strokeWidth={2.5} aria-hidden="true" />
                      )}
                    </label>
                  ))}
                </div>
                <p className={styles.hint}>
                  Keep the template’s palette or add your signature color.
                </p>
              </fieldset>

              <fieldset className={styles.setting}>
                <legend>
                  Typography <span>{selectedFont.name}</span>
                </legend>
                <div className={styles.fontGrid}>
                  {AVAILABLE_FONT_PRESETS.map((font) => (
                    <label
                      key={font.id}
                      className={clsx(
                        styles.fontOption,
                        settings.fontPresetId === font.id && styles.optionSelected
                      )}
                    >
                      <input
                        className={styles.radio}
                        type="radio"
                        name="resume-font"
                        aria-label={font.name}
                        checked={settings.fontPresetId === font.id}
                        onChange={() => updateField({ fontPresetId: font.id })}
                      />
                      <span
                        className={styles.fontSample}
                        style={{ fontFamily: font.headingFamily }}
                        aria-hidden="true"
                      >
                        Aa
                      </span>
                      <span className={styles.optionText}>
                        <strong>{font.name}</strong>
                        <span>{FONT_DETAILS[font.id]}</span>
                      </span>
                      {settings.fontPresetId === font.id && (
                        <Check className={styles.optionCheck} size={15} aria-hidden="true" />
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.setting}>
                <legend>Paper size</legend>
                <div className={styles.paperOptions}>
                  {PAPER_SIZES.map((paper) => (
                    <label
                      key={paper.id}
                      className={clsx(
                        styles.paperOption,
                        settings.pageSize === paper.id && styles.optionSelected
                      )}
                    >
                      <input
                        className={styles.radio}
                        type="radio"
                        name="resume-paper"
                        aria-label={paper.name}
                        checked={settings.pageSize === paper.id}
                        onChange={() => updateField({ pageSize: paper.id })}
                      />
                      <span
                        className={styles.paperIcon}
                        style={{ aspectRatio: paper.ratio }}
                        aria-hidden="true"
                      >
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className={styles.optionText}>
                        <strong>{paper.name}</strong>
                        <span>{paper.dimensions}</span>
                      </span>
                      {settings.pageSize === paper.id && (
                        <Check className={styles.optionCheck} size={15} aria-hidden="true" />
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section
              className={clsx(styles.panel, styles.appearance)}
              aria-labelledby="appearance-heading"
            >
              <div className={styles.appearanceText}>
                <h2 id="appearance-heading">Workspace appearance</h2>
                <p>Choose how Resume Studio looks to you.</p>
              </div>
              <fieldset className={styles.themeOptions}>
                <legend className={styles.srOnly}>Interface theme</legend>
                {[
                  { id: 'light', name: 'Light', icon: Sun },
                  { id: 'dark', name: 'Dark', icon: Moon },
                ].map(({ id, name, icon: Icon }) => (
                  <label
                    key={id}
                    className={clsx(
                      styles.themeOption,
                      activeThemeId === id && styles.optionSelected
                    )}
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
                    {activeThemeId === id && <Check size={14} aria-hidden="true" />}
                  </label>
                ))}
              </fieldset>
            </section>
            <DataBackup />
            <p className={styles.privacyNote}>
              <ShieldCheck size={15} aria-hidden="true" /> Your preferences and resumes stay on this
              device.
            </p>
          </div>

          <aside className={styles.previewCard} aria-labelledby="preview-heading">
            <div className={styles.previewHeader}>
              <div>
                <span className={styles.eyebrow}>
                  <span /> LIVE PREVIEW
                </span>
                <h2 id="preview-heading">Your defaults, in action.</h2>
              </div>
              <select
                className={styles.templateSelect}
                aria-label="Preview template"
                value={previewTemplate}
                onChange={(event) => setPreviewTemplate(event.target.value)}
              >
                {PREVIEW_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.previewStage} ref={previewStage}>
              <ResumePreview
                layoutTree={layoutTree}
                widthPx={previewWidth}
                className={styles.resumePaper}
              />
            </div>
            <div className={styles.previewFooter}>
              <p className={styles.previewMetadata} aria-live="polite">
                <span>{selectedFont.name}</span>
                <span>{settings.pageSize === 'LETTER' ? 'US Letter' : 'A4'}</span>
                <span>{accentName}</span>
              </p>
              <p className={styles.previewCaption}>
                <FileText size={14} aria-hidden="true" /> Sample resume · Page 1 of{' '}
                {layoutTree?.pages.length ?? 1}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageLayout>
  )
}

export default Settings
