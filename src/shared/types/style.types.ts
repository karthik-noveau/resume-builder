import type { FontFamily, FontScale, FontWeight } from './font.types'

/**
 * The seven text roles a resume is built from.
 *
 * Each role maps one-to-one onto a `FontPreset.scale` key, which is what makes
 * role-level sizing safe: a role's size is folded into the font preset *before*
 * the template renders, so the layout engine measures, stacks and paginates
 * with the user's size rather than the preset's. Adding a role without a scale
 * key would silently lose that guarantee — see ROLE_SCALE_KEY.
 */
export type StyleRole =
  | 'name'
  | 'headline'
  | 'contact'
  | 'sectionTitle'
  | 'entryTitle'
  | 'body'
  | 'small'

export const STYLE_ROLES: StyleRole[] = [
  'name', 'headline', 'contact', 'sectionTitle', 'entryTitle', 'body', 'small',
]

/** Role → the `FontPreset.scale` key it owns. */
export const ROLE_SCALE_KEY: Record<StyleRole, keyof FontScale> = {
  name: 'name',
  headline: 'headline',
  contact: 'caption',
  sectionTitle: 'sectionTitle',
  entryTitle: 'entryTitle',
  body: 'body',
  small: 'small',
}

/** Roles that take the heading typeface; the rest take the body typeface. */
export const HEADING_ROLES: StyleRole[] = ['name', 'sectionTitle', 'entryTitle']

export const STYLE_ROLE_LABELS: Record<StyleRole, string> = {
  name: 'Name',
  headline: 'Headline',
  contact: 'Contact details',
  sectionTitle: 'Section headings',
  entryTitle: 'Entry titles',
  body: 'Body text',
  small: 'Dates & small text',
}

export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'

/**
 * A style patch. Every field is optional and absent means "inherit" — from the
 * role above it, and from the template below that. Stored per role and per
 * element, and merged element-over-role at render time.
 */
export interface ElementStyle {
  fontFamily?: FontFamily
  /** Absolute size in points. */
  fontSize?: number
  fontWeight?: FontWeight
  color?: string
  backgroundColor?: string
  lineHeight?: number
  /** In em, matching LayoutStyles.letterSpacing. */
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right'
  textTransform?: TextTransform
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  paddingTopPt?: number
  paddingRightPt?: number
  paddingBottomPt?: number
  paddingLeftPt?: number
}

export interface PageStyle {
  backgroundColor?: string
}

/**
 * Per-resume design overrides, persisted alongside the content.
 *
 * `roles` is the text-style tier and is applied before rendering, so it is
 * fully layout-aware. `elements` is the local-override tier, applied to the
 * finished tree and repaired for flow — the same split a design tool makes
 * between a shared text style and a one-off tweak.
 */
export interface ResumeStyleOverrides {
  roles?: Partial<Record<StyleRole, ElementStyle>>
  elements?: Record<string, ElementStyle>
  page?: PageStyle
}

/** Properties the per-element tier exposes, in the order the inspector shows them. */
export const ELEMENT_STYLE_KEYS: (keyof ElementStyle)[] = [
  'fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor',
  'lineHeight', 'letterSpacing', 'textAlign', 'textTransform',
  'fontStyle', 'textDecoration',
  'paddingTopPt', 'paddingRightPt', 'paddingBottomPt', 'paddingLeftPt',
]

export function isEmptyStyle(style: ElementStyle | undefined): boolean {
  if (!style) return true
  return ELEMENT_STYLE_KEYS.every((key) => style[key] === undefined)
}
