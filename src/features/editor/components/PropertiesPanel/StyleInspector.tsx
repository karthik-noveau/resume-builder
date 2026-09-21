import { useState } from 'react'
import { ColorPicker } from 'antd'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Italic,
  MousePointerClick, Paintbrush, RotateCcw, Underline,
} from 'lucide-react'
import type { Resume } from '@/shared/types/resume.types'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'
import type { ElementStyle, StyleRole, TextTransform } from '@/shared/types/style.types'
import { STYLE_ROLES, STYLE_ROLE_LABELS, isEmptyStyle } from '@/shared/types/style.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { Select } from '@/shared/components/ui/Select/Select'
import styles from './StyleInspector.module.css'

interface StyleInspectorProps {
  resume: Resume
}

const FONT_FAMILIES: { value: FontFamily; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Manrope', label: 'Manrope' },
  { value: 'IBMPlexSans', label: 'IBM Plex Sans' },
  { value: 'SourceSerifPro', label: 'Source Serif' },
]

const FONT_WEIGHTS: { value: FontWeight; label: string }[] = [
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extrabold' },
]

const TRANSFORMS: { value: TextTransform; label: string }[] = [
  { value: 'none', label: 'As typed' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
]

const FONT_SIZE_MIN = 4
const FONT_SIZE_MAX = 96

/**
 * Styling for the one element currently selected on the canvas.
 *
 * This is the panel's default view because it is the only part of it that
 * depends on what you just clicked — the global controls beside it are the same
 * whatever is selected, so they start collapsed.
 */
export function SelectedElementStyle({ resume }: StyleInspectorProps) {
  const styleTarget = useEditorStore((s) => s.styleTarget)
  const clearStyleTarget = useEditorStore((s) => s.clearStyleTarget)
  const setElementStyle = useResumeStore((s) => s.setElementStyle)
  const resetElementStyle = useResumeStore((s) => s.resetElementStyle)

  const elementStyle = styleTarget ? resume.styleOverrides?.elements?.[styleTarget.key] : undefined

  if (!styleTarget) {
    return (
      <div className={styles.emptyTarget}>
        <MousePointerClick size={18} aria-hidden="true" />
        <p className={styles.emptyTitle}>Nothing selected</p>
        <p className={styles.emptyText}>
          Click a heading, a date, a bullet or a divider on the page to give it its own
          colour, size or spacing.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.controls}>
      <div className={styles.targetRow}>
        <span className={styles.targetIcon} aria-hidden="true"><Paintbrush size={14} /></span>
        <div className={styles.targetMeta}>
          <p className={styles.targetName}>{styleTarget.label}</p>
          <p className={styles.targetRole}>
            {styleTarget.role
              ? `Inherits ${STYLE_ROLE_LABELS[styleTarget.role].toLowerCase()}`
              : 'Standalone element'}
          </p>
        </div>
        <button type="button" className={styles.deselect} onClick={clearStyleTarget}>
          Deselect
        </button>
      </div>

      <StyleControls
        value={elementStyle ?? {}}
        onChange={(patch) => setElementStyle(styleTarget.key, patch)}
        showSizing
      />

      {!isEmptyStyle(elementStyle) && (
        <div className={styles.resetRow}>
          {!isEmptyStyle(elementStyle) && (
            <button
              type="button"
              className={styles.inlineReset}
              onClick={() => resetElementStyle(styleTarget.key)}
            >
              <RotateCcw size={12} aria-hidden="true" />
              Reset styling
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The resume-wide half: the seven text styles and the page itself.
 *
 * Text styles are the layout-aware tier — a size set here goes through the font
 * preset before the template renders, so the page reflows rather than
 * overlapping. See engine/style.overrides.ts.
 */
export function GlobalTextStyles({ resume }: StyleInspectorProps) {
  const styleTarget = useEditorStore((s) => s.styleTarget)
  const setRoleStyle = useResumeStore((s) => s.setRoleStyle)
  const resetRoleStyle = useResumeStore((s) => s.resetRoleStyle)
  const setPageBackground = useResumeStore((s) => s.setPageBackground)

  const overrides = resume.styleOverrides

  return (
    <div className={styles.globalRoot}>
      <div className={styles.card}>
        <div className={styles.cardHeading}>
          <div>
            <span className={styles.cardLabel}>Text styles</span>
            <p className={styles.cardHint}>
              Each one changes every matching element and reflows the page.
            </p>
          </div>
        </div>
        <div className={styles.roleList}>
          {STYLE_ROLES.map((role) => (
            <RoleRow
              key={role}
              role={role}
              value={overrides?.roles?.[role] ?? {}}
              highlighted={styleTarget?.role === role}
              onChange={(patch) => setRoleStyle(role, patch)}
              onReset={() => resetRoleStyle(role)}
            />
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeading}>
          <span className={styles.cardLabel}>Page</span>
          {overrides?.page?.backgroundColor && (
            <button
              type="button"
              className={styles.inlineReset}
              onClick={() => setPageBackground(null)}
            >
              <RotateCcw size={12} aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Background</span>
          <ColorPicker
            value={overrides?.page?.backgroundColor ?? '#ffffff'}
            disabledAlpha
            size="small"
            onChangeComplete={(color) => setPageBackground(color.toHexString())}
          />
        </div>
      </div>

    </div>
  )
}

/**
 * Clears every override at once — text styles, per-element tweaks and the page.
 *
 * Rendered above the controls rather than after them: it undoes everything in
 * the panel, so it belongs where you can find it before scrolling through what
 * it would throw away, not tucked under the last of it.
 */
export function ResetAllStyling({ resume }: StyleInspectorProps) {
  const resetAllStyleOverrides = useResumeStore((s) => s.resetAllStyleOverrides)
  const overrides = resume.styleOverrides
  if (!overrides || !(overrides.roles || overrides.elements || overrides.page)) return null

  return (
    <button type="button" className={styles.resetAll} onClick={resetAllStyleOverrides}>
      <RotateCcw size={13} aria-hidden="true" />
      Reset all styling
    </button>
  )
}

// ─── Role row ─────────────────────────────────────────────────────────────────

function RoleRow({
  role, value, highlighted, onChange, onReset,
}: {
  role: StyleRole
  value: ElementStyle
  highlighted: boolean
  onChange: (patch: ElementStyle) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const customized = !isEmptyStyle(value)

  return (
    <div className={styles.roleRow} data-highlighted={highlighted || undefined}>
      <button
        type="button"
        className={styles.roleToggle}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.roleName}>
          {STYLE_ROLE_LABELS[role]}
          {customized && <span className={styles.roleBadge}>Edited</span>}
        </span>
        <ChevronDown
          size={14}
          className={open ? `${styles.roleChevron} ${styles.roleChevronOpen}` : styles.roleChevron}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className={styles.roleBody}>
          <StyleControls value={value} onChange={onChange} showSizing />
          {customized && (
            <button type="button" className={styles.inlineReset} onClick={onReset}>
              <RotateCcw size={12} aria-hidden="true" />
              Reset {STYLE_ROLE_LABELS[role].toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Shared controls ──────────────────────────────────────────────────────────

/**
 * Every control is tri-state: unset means "inherit", and each one can be put
 * back to inherit without having to guess what the template's value was.
 */
function StyleControls({
  value, onChange, showSizing,
}: {
  value: ElementStyle
  onChange: (patch: ElementStyle) => void
  showSizing: boolean
}) {
  const toggle = <K extends keyof ElementStyle>(key: K, on: ElementStyle[K]) => {
    onChange({ [key]: value[key] === on ? undefined : on })
  }

  return (
    <div className={styles.controls}>
      {showSizing && (
        <div className={styles.controlGrid}>
          <Select
            label="Font"
            value={value.fontFamily ?? ''}
            onChange={(e) => onChange({ fontFamily: (e.target.value || undefined) as FontFamily | undefined })}
            options={[{ value: '', label: 'Inherit' }, ...FONT_FAMILIES]}
          />
          <Select
            label="Weight"
            value={value.fontWeight?.toString() ?? ''}
            onChange={(e) => onChange({
              fontWeight: e.target.value ? Number(e.target.value) as FontWeight : undefined,
            })}
            options={[
              { value: '', label: 'Inherit' },
              ...FONT_WEIGHTS.map((w) => ({ value: w.value.toString(), label: w.label })),
            ]}
          />
        </div>
      )}

      {showSizing && (
        <div className={styles.controlGrid}>
          <NumberField
            label="Size (pt)"
            value={value.fontSize}
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step={0.5}
            onChange={(next) => onChange({ fontSize: next })}
          />
          <NumberField
            label="Line height"
            value={value.lineHeight}
            min={0.6}
            max={4}
            step={0.05}
            onChange={(next) => onChange({ lineHeight: next })}
          />
        </div>
      )}

      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>Text colour</span>
        <div className={styles.colorCell}>
          <ColorPicker
            value={value.color ?? '#111827'}
            disabledAlpha
            size="small"
            onChangeComplete={(color) => onChange({ color: color.toHexString().toLowerCase() })}
          />
          <span className={styles.clearSlot}>
            {value.color && (
              <button type="button" className={styles.clearDot} onClick={() => onChange({ color: undefined })} aria-label="Clear text colour">
                <RotateCcw size={11} aria-hidden="true" />
              </button>
            )}
          </span>
        </div>
      </div>

      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>Background</span>
        <div className={styles.colorCell}>
          <ColorPicker
            value={value.backgroundColor ?? '#ffffff'}
            disabledAlpha
            size="small"
            onChangeComplete={(color) => onChange({ backgroundColor: color.toHexString().toLowerCase() })}
          />
          <span className={styles.clearSlot}>
            {value.backgroundColor && (
              <button type="button" className={styles.clearDot} onClick={() => onChange({ backgroundColor: undefined })} aria-label="Clear background">
                <RotateCcw size={11} aria-hidden="true" />
              </button>
            )}
          </span>
        </div>
      </div>

      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>Emphasis</span>
        <div className={styles.toggleGroup}>
          <IconToggle
            label="Bold"
            active={value.fontWeight === 700}
            onClick={() => toggle('fontWeight', 700)}
          ><Bold size={14} aria-hidden="true" /></IconToggle>
          <IconToggle
            label="Italic"
            active={value.fontStyle === 'italic'}
            onClick={() => toggle('fontStyle', 'italic')}
          ><Italic size={14} aria-hidden="true" /></IconToggle>
          <IconToggle
            label="Underline"
            active={value.textDecoration === 'underline'}
            onClick={() => toggle('textDecoration', 'underline')}
          ><Underline size={14} aria-hidden="true" /></IconToggle>
        </div>
      </div>

      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>Alignment</span>
        <div className={styles.toggleGroup}>
          <IconToggle label="Align left" active={value.textAlign === 'left'} onClick={() => toggle('textAlign', 'left')}>
            <AlignLeft size={14} aria-hidden="true" />
          </IconToggle>
          <IconToggle label="Align centre" active={value.textAlign === 'center'} onClick={() => toggle('textAlign', 'center')}>
            <AlignCenter size={14} aria-hidden="true" />
          </IconToggle>
          <IconToggle label="Align right" active={value.textAlign === 'right'} onClick={() => toggle('textAlign', 'right')}>
            <AlignRight size={14} aria-hidden="true" />
          </IconToggle>
        </div>
      </div>

      <div className={styles.controlGrid}>
        <Select
          label="Letter case"
          value={value.textTransform ?? ''}
          onChange={(e) => onChange({ textTransform: (e.target.value || undefined) as TextTransform | undefined })}
          options={[{ value: '', label: 'Inherit' }, ...TRANSFORMS]}
        />
        <NumberField
          label="Tracking (em)"
          value={value.letterSpacing}
          min={-0.2}
          max={1}
          step={0.01}
          onChange={(next) => onChange({ letterSpacing: next })}
        />
      </div>

      <details className={styles.spacing}>
        <summary className={styles.spacingSummary}>
          <span>Padding</span>
          <ChevronDown size={13} aria-hidden="true" />
        </summary>
        <div className={styles.controlGrid}>
          <NumberField label="Top (pt)" value={value.paddingTopPt} min={0} max={120} step={1}
            onChange={(next) => onChange({ paddingTopPt: next })} />
          <NumberField label="Right (pt)" value={value.paddingRightPt} min={0} max={120} step={1}
            onChange={(next) => onChange({ paddingRightPt: next })} />
          <NumberField label="Bottom (pt)" value={value.paddingBottomPt} min={0} max={120} step={1}
            onChange={(next) => onChange({ paddingBottomPt: next })} />
          <NumberField label="Left (pt)" value={value.paddingLeftPt} min={0} max={120} step={1}
            onChange={(next) => onChange({ paddingLeftPt: next })} />
        </div>
      </details>
    </div>
  )
}

function IconToggle({
  label, active, onClick, children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={styles.iconToggle}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/** A number input that keeps "unset" distinct from zero. */
function NumberField({
  label, value, min, max, step, onChange,
}: {
  label: string
  value: number | undefined
  min: number
  max: number
  step: number
  onChange: (next: number | undefined) => void
}) {
  return (
    <label className={styles.numberField}>
      <span className={styles.numberLabel}>{label}</span>
      <input
        type="number"
        className={styles.numberInput}
        value={value ?? ''}
        placeholder="Auto"
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(undefined)
          const parsed = Number(raw)
          if (Number.isNaN(parsed)) return
          onChange(Math.min(max, Math.max(min, parsed)))
        }}
      />
    </label>
  )
}
