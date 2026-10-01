import { useState, type ReactNode } from 'react'
import { ColorPicker } from 'antd'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Italic,
  MousePointerClick, Paintbrush, Palette, RotateCcw, Ruler, Type, Underline,
} from 'lucide-react'
import type { Resume } from '@/shared/types/resume.types'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'
import type { ElementStyle, StyleRole, TextTransform } from '@/shared/types/style.types'
import type { LayoutNode, LayoutTree } from '@/shared/types/layout.types'
import { STYLE_ROLES, STYLE_ROLE_LABELS, isEmptyStyle } from '@/shared/types/style.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { Select } from '@/shared/components/ui/Select/Select'
import styles from './StyleInspector.module.css'
import { findStyleNode } from '../../utils/findStyleNode'
import { isTextNode } from '@/features/templates/engine/style.roles'

interface StyleInspectorProps {
  resume: Resume
  layoutTree?: LayoutTree | null
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
export function SelectedElementStyle({ resume, layoutTree }: StyleInspectorProps) {
  const styleTarget = useEditorStore((s) => s.styleTarget)
  const clearStyleTarget = useEditorStore((s) => s.clearStyleTarget)
  const setElementStyle = useResumeStore((s) => s.setElementStyle)
  const resetElementStyle = useResumeStore((s) => s.resetElementStyle)

  const elementStyle = styleTarget ? resume.styleOverrides?.elements?.[styleTarget.key] : undefined
  const selectedNode = findStyleNode(layoutTree, styleTarget?.key)
  const hasOtherStyling = !isEmptyStyle({ ...elementStyle,
    marginTopPt: undefined, marginRightPt: undefined, marginBottomPt: undefined, marginLeftPt: undefined,
  })

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

      {selectedNode?.type === 'divider' || selectedNode?.type === 'rect' ? (
        <div className={styles.controlSections} key={styleTarget.key}>
          <ControlGroup label={selectedNode.type === 'divider' ? 'Line' : 'Shape'} icon={<Paintbrush size={15} />}>
            <DecorationControls node={selectedNode} value={elementStyle ?? {}}
              onChange={(patch) => setElementStyle(styleTarget.key, patch)} />
          </ControlGroup>
          <SpacingControls value={elementStyle ?? {}} onChange={(patch) => setElementStyle(styleTarget.key, patch)}
            inset={selectedNode.type === 'rect' || selectedNode.heightPt > selectedNode.widthPt} />
        </div>
      ) : !selectedNode || isTextNode(selectedNode) ? (
        <StyleControls
          key={styleTarget.key}
          value={elementStyle ?? {}}
          inherited={styleTarget.role ? resume.styleOverrides?.roles?.[styleTarget.role] : undefined}
          onChange={(patch) => setElementStyle(styleTarget.key, patch)}
        />
      ) : (
        <SpacingControls key={styleTarget.key} value={elementStyle ?? {}}
          onChange={(patch) => setElementStyle(styleTarget.key, patch)} />
      )}

      {hasOtherStyling && (
        <div className={styles.resetRow}>
            <button
              type="button"
              className={styles.inlineReset}
              onClick={() => resetElementStyle(styleTarget.key)}
            >
              <RotateCcw size={12} aria-hidden="true" />
              Reset styling
            </button>
        </div>
      )}
    </div>
  )
}

function DecorationControls({ node, value, onChange }: {
  node: LayoutNode
  value: ElementStyle
  onChange: (patch: ElementStyle) => void
}) {
  const isLine = node.type === 'divider'
  const colorKey = isLine ? 'color' : 'backgroundColor'
  const label = isLine ? 'Line colour' : 'Fill colour'
  const color = value[colorKey] ?? (isLine ? node.styles.color : node.styles.backgroundColor ?? node.styles.color)
  return (
    <div className={styles.controls}>
      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>{label}</span>
        <ColorPicker aria-label={label} value={color} disabledAlpha size="small"
          onChangeComplete={(next) => onChange({ [colorKey]: next.toHexString().toLowerCase() })} />
      </div>
      {isLine && <>
        <div className={styles.controlGrid}>
          <NumberField label="Thickness (pt)" value={value.lineThicknessPt ?? Math.min(node.widthPt, node.heightPt)}
            min={0.25} max={8} step={0.25} commitOnBlur onChange={(lineThicknessPt) => onChange({ lineThicknessPt })} />
          <NumberField label="Length (%)" value={value.lineLengthPercent ?? 100}
            min={10} max={100} step={5} commitOnBlur onChange={(lineLengthPercent) => onChange({ lineLengthPercent })} />
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Alignment</span>
          <div className={styles.toggleGroup}>
            <IconToggle label="Align line to start" active={(value.textAlign ?? 'left') === 'left'} onClick={() => onChange({ textAlign: 'left' })}>
              <AlignLeft size={14} aria-hidden="true" />
            </IconToggle>
            <IconToggle label="Centre line" active={value.textAlign === 'center'} onClick={() => onChange({ textAlign: 'center' })}>
              <AlignCenter size={14} aria-hidden="true" />
            </IconToggle>
            <IconToggle label="Align line to end" active={value.textAlign === 'right'} onClick={() => onChange({ textAlign: 'right' })}>
              <AlignRight size={14} aria-hidden="true" />
            </IconToggle>
          </div>
        </div>
      </>}
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
          <StyleControls value={value} onChange={onChange} />
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
function TypographyControls({
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

    </div>
  )
}

function ControlGroup({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <details className={styles.controlSection} open>
      <summary className={styles.sectionSummary}>
        <span className={styles.sectionIdentity}><span aria-hidden="true">{icon}</span>{label}</span>
        <ChevronDown size={14} aria-hidden="true" className={styles.sectionChevron} />
      </summary>
      <div className={styles.sectionBody}>{children}</div>
    </details>
  )
}

interface StyleControlProps {
  value: ElementStyle
  inherited?: ElementStyle
  onChange: (patch: ElementStyle) => void
}

function StyleControls({ value, inherited, onChange }: StyleControlProps) {
  return (
    <div className={styles.controlSections}>
      <ControlGroup label="Typography" icon={<Type size={15} />}>
        <TypographyControls value={value} onChange={onChange} showSizing />
      </ControlGroup>
      <ControlGroup label="Colour" icon={<Palette size={15} />}>
        {([
          ['color', 'Text colour', '#111827', 'Clear text colour'],
          ['backgroundColor', 'Background', '#ffffff', 'Clear background'],
        ] as const).map(([key, label, fallback, clearLabel]) => (
          <div key={key} className={styles.controlRow}>
            <span className={styles.controlLabel}>{label}</span>
            <div className={styles.colorCell}>
              <ColorPicker aria-label={label} value={value[key] ?? fallback} disabledAlpha size="small"
                onChangeComplete={(color) => onChange({ [key]: color.toHexString().toLowerCase() })} />
              <span className={styles.clearSlot}>
                {value[key] && <button type="button" className={styles.clearDot} onClick={() => onChange({ [key]: undefined })} aria-label={clearLabel}>
                  <RotateCcw size={11} aria-hidden="true" />
                </button>}
              </span>
            </div>
          </div>
        ))}
      </ControlGroup>
      <SpacingControls value={value} inherited={inherited} onChange={onChange} showPadding />
    </div>
  )
}

function SpacingControls({ value, inherited, onChange, inset = false, showPadding = false }: StyleControlProps & {
  inset?: boolean
  showPadding?: boolean
}) {
  return (
    <ControlGroup label="Spacing" icon={<Ruler size={15} />}>
      <MarginControls value={value} inherited={inherited} onChange={onChange} inset={inset} />
      {showPadding && (
        <fieldset className={styles.spacingFields}>
          <legend className={styles.spacingLegend}>Padding <span>Inside the element</span></legend>
          <div className={styles.controlGrid}>
            {([
              ['paddingTopPt', 'Top'], ['paddingRightPt', 'Right'],
              ['paddingBottomPt', 'Bottom'], ['paddingLeftPt', 'Left'],
            ] as const).map(([key, label]) => (
              <NumberField key={key} label={`${label} (pt)`} ariaLabel={`${label} padding (pt)`}
                value={value[key]} min={0} max={120} step={1}
                onChange={(next) => onChange({ [key]: next })} />
            ))}
          </div>
        </fieldset>
      )}
    </ControlGroup>
  )
}

const MARGIN_FIELDS = [
  ['marginTopPt', 'Top'], ['marginRightPt', 'Right'],
  ['marginBottomPt', 'Bottom'], ['marginLeftPt', 'Left'],
] as const

function MarginControls({ value, inherited, onChange, inset = false }: {
  value: ElementStyle
  inherited?: ElementStyle
  onChange: (patch: ElementStyle) => void
  inset?: boolean
}) {
  const customized = MARGIN_FIELDS.some(([key]) => value[key] !== undefined)
  return (
    <fieldset className={styles.spacingFields}>
      <legend className={styles.spacingLegend}>Margin <span>{inset ? 'Inset from original bounds' : 'Outside the element'}</span></legend>
      <div className={styles.controlGrid}>
        {MARGIN_FIELDS.map(([key, label]) => (
          <NumberField key={key} label={`${label} (pt)`} ariaLabel={`${label} margin (pt)`}
            value={value[key]} placeholder={String(inherited?.[key] ?? 0)}
            min={0} max={120} step={1} commitOnBlur
            onChange={(next) => onChange({ [key]: next })} />
        ))}
      </div>
      {customized && <button type="button" className={styles.inlineReset}
        onClick={() => onChange({ marginTopPt: undefined, marginRightPt: undefined, marginBottomPt: undefined, marginLeftPt: undefined })}>
        <RotateCcw size={12} aria-hidden="true" /> Reset margins
      </button>}
    </fieldset>
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
  label, value, min, max, step, onChange, commitOnBlur = false, ariaLabel, placeholder = 'Auto',
}: {
  label: string
  value: number | undefined
  min: number
  max: number
  step: number
  onChange: (next: number | undefined) => void
  commitOnBlur?: boolean
  ariaLabel?: string
  placeholder?: string
}) {
  const [draft, setDraft] = useState<string>()
  const commit = (raw: string) => {
    if (raw === '') return onChange(undefined)
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    const next = Math.min(max, Math.max(min, parsed))
    if (next !== value) onChange(next)
  }
  return (
    <label className={styles.numberField}>
      <span className={styles.numberLabel}>{label}</span>
      <input
        type="number"
        className={styles.numberInput}
        value={draft ?? value ?? ''}
        aria-label={ariaLabel}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          if (commitOnBlur) setDraft(e.target.value)
          else commit(e.target.value)
        }}
        onBlur={() => {
          if (draft !== undefined) commit(draft)
          setDraft(undefined)
        }}
        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
      />
    </label>
  )
}
