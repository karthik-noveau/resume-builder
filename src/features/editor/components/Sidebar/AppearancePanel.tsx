import { ColorPicker } from 'antd'
import { RotateCcw } from 'lucide-react'
import type { Resume } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { AVAILABLE_FONT_PRESETS } from '@/shared/stores/theme.store'
import { Select } from '@/shared/components/ui/Select/Select'
import {
  getTemplateColorConfiguration,
  resolveTemplateColors,
  type TemplateColorKey,
} from '@/shared/utils/templateColors'
import { COLOR_GROUPS, type ColorControl } from './colorGroups'
import styles from './AppearancePanel.module.css'

interface AppearancePanelProps {
  resume: Resume
}

type ColorPreset = {
  id: string
  label: string
  colors: Record<TemplateColorKey, string>
}

const makePreset = (
  id: string,
  label: string,
  accent: string,
  heading: string,
  body: string,
  muted: string,
  divider: string,
  soft: string,
  panel: string,
  panelSecondary: string,
): ColorPreset => ({
  id,
  label,
  colors: {
    accent,
    sectionTitle: heading,
    sectionDescription: body,
    sectionBorder: accent,
    sectionIcon: heading,
    sectionBackground: soft,
    primaryText: body,
    secondaryText: muted,
    mutedText: muted,
    divider,
    softBackground: soft,
    panelBackground: panel,
    panelText: '#ffffff',
    panelSecondaryText: panelSecondary,
  },
})

const COLOR_PRESETS: ColorPreset[] = [
  makePreset('navy', 'Navy', '#0b5796', '#0d3559', '#172b3d', '#526779', '#bfd0df', '#eaf4fc', '#0d3f69', '#bddcf3'),
  makePreset('forest', 'Forest', '#008269', '#075a4a', '#173b32', '#4e6d64', '#bcd7d0', '#e9fbf6', '#075f4f', '#b8eadf'),
  makePreset('burgundy', 'Burgundy', '#a42446', '#68152e', '#40202a', '#765562', '#e2c2cc', '#fff0f4', '#721a33', '#f0c2d0'),
  makePreset('copper', 'Copper', '#b6530c', '#763006', '#492818', '#795d4c', '#e4c8b7', '#fff3eb', '#7d3509', '#f1c8ad'),
  makePreset('graphite', 'Graphite', '#3f5268', '#1e3147', '#223344', '#56697a', '#c5d0d9', '#edf2f6', '#24384d', '#cad7e1'),
]

export function AppearancePanel({ resume }: AppearancePanelProps) {
  const updateResume = useResumeStore((s) => s.updateResume)
  const updateSettings = useResumeStore((s) => s.updateSettings)

  const colorConfig = getTemplateColorConfiguration(resume.templateId)
  const resolvedColors = resolveTemplateColors(resume, colorConfig.defaults)
  const hasCustomColors = Boolean(resume.templateColors && Object.keys(resume.templateColors).length)
    || resume.themeId === 'custom'

  const updateControl = (keys: TemplateColorKey[], value: string) => {
    const normalizedValue = value.toLowerCase()
    const patch = Object.fromEntries(
      keys.filter((key) => colorConfig.fields.includes(key)).map((key) => [key, normalizedValue]),
    )
    updateResume({ templateColors: { ...resume.templateColors, ...patch } })
  }

  const resetColors = () => {
    updateResume({ themeId: 'light', customPrimaryColor: undefined, templateColors: undefined })
  }

  const applyColorPreset = (preset: ColorPreset) => {
    const templateColors = Object.fromEntries(
      colorConfig.fields.map((key) => [key, preset.colors[key]]),
    )
    updateResume({ themeId: 'light', customPrimaryColor: undefined, templateColors })
  }

  const isPresetActive = (preset: ColorPreset) => colorConfig.fields.every(
    (key) => resolvedColors[key].toLowerCase() === preset.colors[key],
  )

  // Swatch only: the hex readout doubled each row's width for a value nobody
  // reads back, and the picker shows it the moment you open it.
  const renderControl = (control: ColorControl) => {
    const activeKeys = control.keys.filter((key) => colorConfig.fields.includes(key))
    if (!activeKeys.length) return null
    return (
      <div className={styles.colorRow} key={control.id}>
        <span className={styles.colorLabel} title={control.description}>{control.label}</span>
        <ColorPicker
          className={styles.colorPicker}
          value={resolvedColors[activeKeys[0]]}
          disabledAlpha
          size="small"
          onChangeComplete={(color) => updateControl(activeKeys, color.toHexString())}
        />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* Stacked, not tabbed — three short controls that fit together, laid out
          like the Properties panel's fields so the two sidebars read alike.
          Tabs hid two thirds of the panel to save space it did not need. */}
      <div className={styles.body}>
        <div className={styles.fieldCard}>
          <Select
            label="Typography"
            value={resume.fontPresetId}
            onChange={(e) => { updateResume({ fontPresetId: e.target.value }) }}
            options={AVAILABLE_FONT_PRESETS.map((fp) => ({ value: fp.id, label: fp.name }))}
          />
          <p className={styles.fieldHint}>Applies a coordinated heading and body-font pairing.</p>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Text size</span>
            <div className={styles.optionGrid}>
              {(['small', 'standard', 'large'] as const).map((value) => (
                <button
                  type="button"
                  className={styles.optionButton}
                  aria-pressed={(resume.settings.typographyScale ?? 'standard') === value}
                  onClick={() => updateSettings({ typographyScale: value })}
                  key={value}
                >
                  {value === 'small' ? 'Small' : value === 'standard' ? 'Standard' : 'Large'}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Line height</span>
            <div className={styles.optionGrid}>
              {(['compact', 'balanced', 'relaxed'] as const).map((value) => (
                <button
                  type="button"
                  className={styles.optionButton}
                  aria-pressed={(resume.settings.lineHeightDensity ?? 'balanced') === value}
                  onClick={() => updateSettings({ lineHeightDensity: value })}
                  key={value}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.fieldCard}>
          <div className={styles.colorHeading}>
            <span className={styles.fieldLabel}>Resume colors</span>
            {hasCustomColors && (
              <button type="button" className={styles.resetColors} onClick={resetColors}>
                <RotateCcw size={13} aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
          <div className={styles.paletteRow} aria-label="Color palettes">
            <PaletteDot
              label="Original"
              colors={[colorConfig.defaults.accent, colorConfig.defaults.sectionTitle, colorConfig.defaults.softBackground]}
              active={!hasCustomColors}
              onClick={resetColors}
            />
            {COLOR_PRESETS.map((preset) => (
              <PaletteDot
                key={preset.id}
                label={preset.label}
                colors={[preset.colors.accent, preset.colors.sectionTitle, preset.colors.softBackground]}
                active={isPresetActive(preset)}
                onClick={() => applyColorPreset(preset)}
              />
            ))}
          </div>

          {COLOR_GROUPS.map((group) => {
            const controls = group.controls.map(renderControl).filter(Boolean)
            if (!controls.length) return null
            return (
              <div className={styles.colorGroup} key={group.id}>
                <span className={styles.colorGroupLabel}>{group.label}</span>
                <div className={styles.colorRows}>{controls}</div>
              </div>
            )
          })}
        </div>

      </div>

    </div>
  )
}

/** A palette as one round chip: its accent, heading and tint in a single dot. */
function PaletteDot({
  label, colors, active, onClick,
}: {
  label: string
  colors: [string, string, string]
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={styles.paletteDot}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        backgroundImage: `linear-gradient(135deg, ${colors[0]} 0 33.34%, ${colors[1]} 33.34% 66.67%, ${colors[2]} 66.67% 100%)`,
      }}
    />
  )
}
