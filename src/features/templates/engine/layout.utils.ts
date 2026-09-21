import type { LayoutStyles } from '@/shared/types/layout.types'
import type { FontFamily, FontPreset, FontWeight } from '@/shared/types/font.types'
import type { ThemeColors } from '@/shared/types/theme.types'
import type { ResumeSettings } from '@/shared/types/resume.types'
import { measureTextWidth, wrapTextLines } from '@/shared/utils/textMeasurement'

interface TemplateTypographyDefaults {
  headingFamily?: FontFamily
  bodyFamily?: FontFamily
  scale?: Partial<FontPreset['scale']>
  lineHeight?: Partial<FontPreset['lineHeight']>
}

/**
 * Gives a template a carefully tuned default type system while preserving the
 * user's explicit font-preset choice. The app's `professional` preset is the
 * neutral starting point used by new resumes; every other preset is intent.
 */
export function resolveTemplateTypography(
  fp: FontPreset,
  defaults: TemplateTypographyDefaults,
): FontPreset {
  if (fp.id !== 'professional') return fp
  return {
    ...fp,
    headingFamily: defaults.headingFamily ?? fp.headingFamily,
    bodyFamily: defaults.bodyFamily ?? fp.bodyFamily,
    scale: { ...fp.scale, ...defaults.scale },
    lineHeight: { ...fp.lineHeight, ...defaults.lineHeight },
  }
}

/** Applies user-facing size and leading controls after template defaults have
 * been resolved, so every template keeps its identity at the balanced setting. */
export function applyResumeTypography(fp: FontPreset, settings: ResumeSettings): FontPreset {
  const sizeMultiplier = {
    small: 0.94,
    standard: 1,
    large: 1.06,
  }[settings.typographyScale ?? 'standard']
  const leadingMultiplier = {
    compact: 0.93,
    balanced: 1,
    relaxed: 1.08,
  }[settings.lineHeightDensity ?? 'balanced']
  const scaled = (value: number) => Math.round(value * sizeMultiplier * 100) / 100
  const scale: FontPreset['scale'] = {
    name: scaled(fp.scale.name),
    headline: scaled(fp.scale.headline),
    sectionTitle: scaled(fp.scale.sectionTitle),
    entryTitle: scaled(fp.scale.entryTitle),
    body: scaled(fp.scale.body),
    small: scaled(fp.scale.small),
    caption: scaled(fp.scale.caption),
  }
  const scaledPreset: FontPreset = {
    ...fp,
    scale,
    lineHeight: {
      heading: Math.round(fp.lineHeight.heading * leadingMultiplier * 1000) / 1000,
      body: Math.round(fp.lineHeight.body * leadingMultiplier * 1000) / 1000,
    },
  }
  // Last word goes to the user's own text styles. This runs at the very end of
  // every render path on purpose: resolveTemplateTypography lets a template
  // replace a preset's scale, and an explicit choice in the style inspector has
  // to outrank that — otherwise setting a size would appear to do nothing on
  // the templates that ship their own.
  return applyRoleTypographyOverrides(scaledPreset)
}

/** Folds `fp.roleOverrides` into the preset itself. Absent values inherit. */
export function applyRoleTypographyOverrides(fp: FontPreset): FontPreset {
  const o = fp.roleOverrides
  if (!o) return fp
  return {
    ...fp,
    headingFamily: o.headingFamily ?? fp.headingFamily,
    bodyFamily: o.bodyFamily ?? fp.bodyFamily,
    scale: { ...fp.scale, ...o.scale },
    lineHeight: { ...fp.lineHeight, ...o.lineHeight },
  }
}

export function resumeSpacingMultiplier(settings: ResumeSettings): number {
  return {
    compact: 0.82,
    balanced: 1,
    spacious: 1.18,
  }[settings.spacingDensity ?? 'balanced']
}

// ─── Text height estimation ───────────────────────────────────────────────────

/** Estimate how many lines a string will occupy at a given font size and container width. */
export function estimateLines(text: string, containerWidthPt: number, fontSize: number): number {
  if (!text || containerWidthPt <= 0) return 1
  // Average character width for modern sans/serif fonts. Erring slightly wide
  // is deliberate: underestimating causes visible text overlap (no box
  // clipping), while overestimating only adds a little extra whitespace.
  const avgCharWidth = fontSize * 0.52
  const charsPerLine = Math.max(1, containerWidthPt / avgCharWidth)
  
  // Account for newlines in content
  const lines = text.split('\n').map(line => Math.ceil(line.length / charsPerLine) || 1)
  return lines.reduce((a, b) => a + b, 0)
}

export function estimateTextHeight(
  text: string,
  containerWidthPt: number,
  fontSize: number,
  lineHeight: number,
  family: FontFamily = 'Inter',
  weight: FontWeight = 400,
): number {
  if (measureTextWidth('M', fontSize, family, weight) !== undefined) {
    return wrapTextLines(text, containerWidthPt, value => measureTextWidth(value, fontSize, family, weight)!)
      .length * fontSize * lineHeight
  }
  return estimateLines(text, containerWidthPt, fontSize) * fontSize * lineHeight
}

/**
 * Average glyph width as a fraction of font size.
 *
 * `estimateLines` above assumes 0.52, which is right for mixed-case prose but
 * measures short of reality for the letterspaced capitals used in section
 * titles: capitals are wider than the mixed-case average, and letter spacing
 * adds to every glyph. Measuring a caps title with the prose figure reports one
 * line for something that renders as two, and the block beneath it then draws
 * on top.
 */
export function avgGlyphWidth(text: string, fontSize: number, letterSpacing = 0): number {
  const isAllCaps = /[A-Z]/.test(text) && text === text.toUpperCase()
  // Calibrated against canvas measureText across the four shipped families at
  // weights 400–700: capitals measured 0.62–0.672 em/char, mixed case
  // 0.44–0.527. Both constants sit just above the observed maximum, because
  // measuring short overlaps text while measuring long only costs whitespace.
  // Capitals are the case that matters here: body copy renders at weight
  // 400-500 (0.44-0.516 measured), which the 0.52 estimateLines already uses
  // for prose covers, so this keeps that figure and only widens for caps.
  return fontSize * ((isAllCaps ? 0.68 : 0.52) + letterSpacing)
}

/** Height a run of text needs, accounting for capitals and letter spacing. */
export function estimateStyledTextHeight(
  text: string,
  containerWidthPt: number,
  fontSize: number,
  lineHeight: number,
  letterSpacing = 0,
  family: FontFamily = 'Inter',
  weight: FontWeight = 400,
): number {
  if (!text || containerWidthPt <= 0) return fontSize * lineHeight
  if (measureTextWidth('M', fontSize, family, weight) !== undefined) {
    return wrapTextLines(text, containerWidthPt, value => measureTextWidth(value, fontSize, family, weight, letterSpacing)!)
      .length * fontSize * lineHeight
  }
  const charsPerLine = Math.max(1, containerWidthPt / avgGlyphWidth(text, fontSize, letterSpacing))
  const lines = text
    .split('\n')
    .reduce((sum, line) => sum + (Math.ceil(line.length / charsPerLine) || 1), 0)
  return lines * fontSize * lineHeight
}

/** Narrow nameplates wrap at word boundaries, not at a fixed character count. */
export function estimateWrappedTextHeight(
  text: string,
  widthPt: number,
  fontSize: number,
  lineHeight: number,
  family: FontFamily = 'Inter',
  weight: FontWeight = 400,
): number {
  if (measureTextWidth('M', fontSize, family, weight) !== undefined) {
    return estimateTextHeight(text, widthPt, fontSize, lineHeight, family, weight)
  }
  const capacity = Math.max(1, widthPt / avgGlyphWidth(text, fontSize))
  const lines = text.split('\n').reduce((total, paragraph) => {
    let count = 1
    let used = 0
    for (const word of paragraph.trim().split(/\s+/)) {
      const gap = used ? 1 : 0
      if (used && used + gap + word.length > capacity) {
        count++
        used = 0
      }
      const wordLines = Math.max(1, Math.ceil(word.length / capacity))
      count += wordLines - 1
      used = wordLines > 1 ? word.length - (wordLines - 1) * capacity : used + (used ? 1 : 0) + word.length
    }
    return total + count
  }, 0)
  return lines * fontSize * lineHeight
}

export function estimateBulletHeight(
  bullet: string,
  containerWidthPt: number,
  fontSize: number,
  lineHeight: number
): number {
  const indent = fontSize * 1.5 
  return estimateTextHeight(bullet, containerWidthPt - indent, fontSize, lineHeight)
}

/**
 * Trims a URL down to what belongs on a printed resume: no scheme, no "www.",
 * no trailing slash. Keeps links inside narrow sidebar columns instead of
 * wrapping mid-word, and matches how people actually write them on a CV
 * ("linkedin.com/in/alexmorgan", not "https://linkedin.com/in/alexmorgan").
 */
export function displayUrl(raw: string): string {
  if (!raw) return ''
  return raw
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
}

// ─── Style builders ───────────────────────────────────────────────────────────

export function baseTextStyle(
  fontFamily: FontFamily,
  fontSize: number,
  fontWeight: FontWeight,
  color: string,
  lineHeight: number,
  textAlign: 'left' | 'center' | 'right' = 'left'
): LayoutStyles {
  return { 
    fontFamily, 
    fontSize, 
    fontWeight, 
    color, 
    lineHeight, 
    textAlign,
    letterSpacing: 0,
    fontStyle: 'normal'
  }
}

export function nameStyle(colors: ThemeColors, fp: FontPreset, forceBlack: boolean): LayoutStyles {
  return {
    ...baseTextStyle(
        fp.headingFamily,
        fp.scale.name,
        700,
        forceBlack ? '#000000' : colors.textPrimary,
        fp.lineHeight.heading,
        'left'
    ),
    letterSpacing: -0.02
  }
}

export function sectionTitleStyle(colors: ThemeColors, fp: FontPreset, forceBlack: boolean, uppercase = false): LayoutStyles {
  return {
    ...baseTextStyle(
      fp.headingFamily,
      fp.scale.sectionTitle,
      700,
      forceBlack ? '#000000' : colors.textPrimary,
      fp.lineHeight.heading
    ),
    letterSpacing: uppercase ? 0.05 : 0.01,
  }
}

export function entryTitleStyle(colors: ThemeColors, fp: FontPreset, forceBlack: boolean): LayoutStyles {
  return baseTextStyle(
    fp.headingFamily,
    fp.scale.entryTitle,
    700,
    forceBlack ? '#000000' : colors.textPrimary,
    fp.lineHeight.heading
  )
}

export function bodyStyle(colors: ThemeColors, fp: FontPreset, forceBlack: boolean): LayoutStyles {
  return baseTextStyle(
    fp.bodyFamily,
    fp.scale.body,
    400,
    forceBlack ? '#000000' : colors.textPrimary,
    fp.lineHeight.body
  )
}

export function metadataStyle(colors: ThemeColors, fp: FontPreset): LayoutStyles {
  return baseTextStyle(fp.bodyFamily, fp.scale.small, 400, colors.textMuted, 1.4)
}

export function smallStyle(colors: ThemeColors, fp: FontPreset): LayoutStyles {
  return baseTextStyle(fp.bodyFamily, fp.scale.small, 400, colors.textSecondary, fp.lineHeight.body)
}

export function captionStyle(colors: ThemeColors, fp: FontPreset): LayoutStyles {
  return baseTextStyle(fp.bodyFamily, fp.scale.caption, 400, colors.textMuted, 1.3)
}

export function dividerStyle(colors: ThemeColors): LayoutStyles {
  return baseTextStyle('Inter', 0, 400, colors.divider, 1)
}

export function accentStyle(colors: ThemeColors, fp: FontPreset): LayoutStyles {
  return baseTextStyle(fp.headingFamily, fp.scale.sectionTitle, 700, colors.primary, fp.lineHeight.heading)
}
