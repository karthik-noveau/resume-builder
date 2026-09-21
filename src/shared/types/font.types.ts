export type FontFamily = 'Inter' | 'SourceSerifPro' | 'Manrope' | 'IBMPlexSans'

export type FontWeight = 400 | 500 | 600 | 700 | 800

export interface FontScale {
  name: number
  headline: number
  sectionTitle: number
  entryTitle: number
  body: number
  small: number
  caption: number
}

export interface FontLineHeight {
  heading: number
  body: number
}

export interface FontLetterSpacing {
  heading: number
  body: number
}

/**
 * Per-resume typography chosen by the user at the text-style level.
 *
 * Carried on the preset rather than merged into it up front because a template
 * is allowed to override a preset's scale (see resolveTemplateTypography), and
 * an explicit user choice must outrank a template default. `applyResumeTypography`
 * runs last in every render path and re-applies these on the way out.
 */
export interface RoleTypographyOverrides {
  scale?: Partial<FontScale>
  headingFamily?: FontFamily
  bodyFamily?: FontFamily
  lineHeight?: Partial<FontLineHeight>
}

export interface FontPreset {
  id: string
  name: string
  headingFamily: FontFamily
  bodyFamily: FontFamily
  scale: FontScale
  lineHeight: FontLineHeight
  letterSpacing: FontLetterSpacing
  roleOverrides?: RoleTypographyOverrides
}
