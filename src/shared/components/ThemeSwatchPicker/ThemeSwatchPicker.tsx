import { ColorPicker } from 'antd'
import { Palette } from 'lucide-react'
import { clsx } from 'clsx'
import { AVAILABLE_THEMES, CUSTOM_THEME_ID, DEFAULT_CUSTOM_PRIMARY_COLOR } from '@/shared/stores/theme.store'
import styles from './ThemeSwatchPicker.module.css'

interface ThemeSwatchValue {
  themeId: string
  customPrimaryColor?: string
}

interface ThemeSwatchPickerProps {
  themeId: string
  customPrimaryColor?: string
  onChange: (value: ThemeSwatchValue) => void
  size?: number
}

/** Light/Dark/Custom color swatches — used in the Appearance panel and on template cards. */
export function ThemeSwatchPicker({ themeId, customPrimaryColor, onChange, size = 28 }: ThemeSwatchPickerProps) {
  const isCustom = themeId === CUSTOM_THEME_ID
  const customColor = customPrimaryColor || DEFAULT_CUSTOM_PRIMARY_COLOR
  const outer = { width: size, height: size }
  const inner = { width: size - 8, height: size - 8 }

  return (
    <div className={styles.root} role="group" aria-label="Color theme">
      {AVAILABLE_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          aria-pressed={themeId === theme.id}
          title={theme.name}
          onClick={(e) => {
            e.stopPropagation()
            onChange({ themeId: theme.id })
          }}
          style={outer}
          className={clsx(styles.swatchButton, themeId === theme.id && styles.swatchButtonActive)}
        >
          <span
            style={{ ...inner, backgroundColor: theme.colors.primary }}
            className={styles.swatchInner}
          />
        </button>
      ))}

      <ColorPicker
        value={customColor}
        disabledAlpha
        onChangeComplete={(color) => {
          onChange({ themeId: CUSTOM_THEME_ID, customPrimaryColor: color.toHexString() })
        }}
      >
        <button
          type="button"
          title="Custom color"
          aria-label="Pick a custom accent color"
          onClick={(e) => e.stopPropagation()}
          style={outer}
          className={clsx(styles.customLabel, isCustom && styles.customLabelActive)}
        >
          <span
            style={{ ...inner, backgroundColor: isCustom ? customColor : undefined }}
            className={styles.customInner}
          >
            {!isCustom && <Palette size={Math.round(size * 0.4)} className={styles.customIcon} aria-hidden="true" />}
          </span>
        </button>
      </ColorPicker>
    </div>
  )
}
