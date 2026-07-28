import type { Resume, SectionType } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontFamily, FontPreset, FontWeight } from '@/shared/types/font.types'
import type { LayoutTree, LayoutNode, LayoutStyles, EditRef, IconName } from '@/shared/types/layout.types'
import { tintColor, CUSTOM_THEME_ID } from '@/shared/stores/theme.store'
import { LayoutBuilder } from './layout.builder'
import {
  buildExperienceEntry,
  buildEducationEntry,
  buildSkillPills,
  buildSkillBar,
  buildProjectEntry,
  buildCertEntry,
  placeEntryBlock,
  type EntryResult,
  type SectionHeaderResult,
} from './section.renderers'
import { estimateTextHeight, estimateStyledTextHeight, avgGlyphWidth, displayUrl } from './layout.utils'
import { resolveSectionIcon } from './icons'
import type { TemplateRenderFn } from './template.renderer'

/**
 * Declarative single-column template kit.
 *
 * Every template built here shares one measurement, placement and pagination
 * path, so a new template is a palette plus a choice of header and section
 * header — not a fresh coordinate system. That is deliberate: misalignment and
 * broken page breaks come from per-template layout arithmetic, and there is
 * exactly one copy of that arithmetic to get right here.
 *
 * Single column throughout, which is also what the ATS scorer rewards: a
 * two-column PDF interleaves its text layer and is the main reason parsers
 * misread a resume.
 */

// ─── Spec ─────────────────────────────────────────────────────────────────────

export type HeaderVariant =
  | 'stacked'   // name left, headline under it, contact row, rule beneath
  | 'centered'  // name and contact centred — the classic consulting/banking sheet
  | 'banner'    // name reversed out of a full-width accent band
  | 'split'     // name left, contact stacked right, aligned to a shared baseline
  | 'rule'      // name between two hairlines, contact centred under
  | 'monogram'  // initials tile beside the name block
  | 'band-photo' // full-bleed dark band across the top holding a circular portrait, name and role

export type SectionHeaderVariant =
  | 'underline'  // title with a hairline directly beneath
  | 'caps-rule'  // letterspaced caps, rule to the right of the words
  | 'bar'        // short accent bar above the title
  | 'boxed'      // title on a tinted full-width band
  | 'icon'       // section icon then title, hairline beneath
  | 'side-label' // small caps title with a leading accent tick
  | 'plain'      // title alone, spacing carries the separation

export type Density = 'compact' | 'regular' | 'roomy'

/**
 * The page's overall shape. This is what actually distinguishes one template
 * from another — header and section-title treatments are detail by comparison,
 * and a catalog that varies only those reads as one design recoloured.
 */
export type BodyLayout = 'single' | 'sidebar-left' | 'sidebar-right'

export interface SidebarSpec {
  /** Panel width as a fraction of the page. */
  widthPct: number
  /** `dark` reverses the text out of a filled panel; `tint` is a wash. */
  tone: 'dark' | 'tint'
  /**
   * Portrait at the top of the panel, when the resume has one. `bleed` fills
   * the panel edge to edge with no padding; `circle` is the inset roundel.
   */
  photo?: 'circle' | 'bleed'
  /**
   * Puts the name and headline at the top of the panel instead of over the
   * main column — a different silhouette entirely, and visible in the picker
   * whether or not a portrait has been uploaded.
   */
  nameInPanel?: boolean
  /** Sections that live in the panel; everything else stays in the main column. */
  sections: SectionType[]
}

export interface TemplateSpec {
  id: string
  /**
   * The template's own accent. This is its identity — without it every
   * template renders in the same app-theme colour and the catalog reads as one
   * design repeated. A colour the user picks per resume still wins; see
   * `resolvePalette`.
   */
  accent: string
  /** Typeface identity, overridden when the user picks a font preset. */
  headingFamily?: FontFamily
  bodyFamily?: FontFamily
  /** Body text colour — the template's own identity, unaffected by theme. */
  ink: string
  muted: string
  rule: string
  /** Fill for banded headers and boxed section titles. */
  band?: string
  marginMm: number
  /**
   * Contact details as a strip across the foot of every page rather than under
   * the name. Sized to sit inside the bottom margin so it never collides with
   * the text column.
   */
  footerContact?: boolean
  /**
   * `meter` draws each skill as a labelled proficiency bar instead of a pill —
   * the signature of the "modern CV" family, and only legible in a column wide
   * enough to hold a bar, so it pairs with a panel.
   */
  skills?: 'pills' | 'meter'
  /**
   * Runs a hairline down the left of the experience column with a dot against
   * every entry, tying a run of roles into one visible sequence.
   */
  timeline?: boolean
  body?: BodyLayout
  sidebar?: SidebarSpec
  header: HeaderVariant
  sectionHeader: SectionHeaderVariant
  density: Density
  uppercaseName?: boolean
  uppercaseSectionTitles?: boolean
  /** Per-template wording, e.g. "Experience" vs "Professional Experience". */
  titles?: Partial<Record<SectionType, string>>
}

const DEFAULT_TITLES: Record<SectionType, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  custom: 'Additional',
}

interface Metrics {
  /** Space below a section block before the next one starts. */
  sectionGap: number
  /** Space between sibling entries inside one section. */
  entryGap: number
  /** Space between the header block and the first section. */
  headerGap: number
}

const METRICS: Record<Density, Metrics> = {
  compact: { sectionGap: 12, entryGap: 9, headerGap: 12 },
  regular: { sectionGap: 16, entryGap: 13, headerGap: 16 },
  roomy: { sectionGap: 22, entryGap: 17, headerGap: 22 },
}

// ─── Colour ───────────────────────────────────────────────────────────────────

/**
 * The template owns ink, rules and its accent; a colour the user picks for a
 * resume overrides the accent.
 */
function resolvePalette(spec: TemplateSpec, theme: Theme, forceBlack: boolean): ThemeColors {
  // The template's accent is the default; a colour the user actually chose for
  // this resume (which is what CUSTOM_THEME_ID means) overrides it. Deferring
  // to the theme unconditionally was what made all ten look identical.
  const chosen = theme.id === CUSTOM_THEME_ID
  const accent = forceBlack ? '#000000' : (chosen ? theme.colors.primary : spec.accent)
  return {
    primary: accent,
    primaryHover: theme.colors.primaryHover,
    primaryActive: theme.colors.primaryActive,
    background: '#ffffff',
    surface: '#ffffff',
    surfaceElevated: spec.band ?? tintColor(accent, 0.94),
    textPrimary: forceBlack ? '#000000' : spec.ink,
    textSecondary: forceBlack ? '#000000' : spec.muted,
    textMuted: forceBlack ? '#000000' : spec.muted,
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0284c7',
    accent,
    divider: spec.rule,
  }
}


/**
 * Heaviest weight actually bundled for a family.
 *
 * Only Inter ships an ExtraBold — asking for 800 in any other family would
 * leave `font.embedder` with no file to embed at export time, so the display
 * weight is chosen from what exists rather than assumed.
 */
function displayWeight(family: FontFamily): FontWeight {
  return family === 'Inter' ? 800 : 700
}

// ─── Header variants ──────────────────────────────────────────────────────────

function contactLine(resume: Resume, separator = '  ·  '): string {
  const i = resume.personalInfo
  return [i.location, i.phone, i.email, displayUrl(i.website || i.linkedin)]
    .filter(Boolean)
    .join(separator)
}

function renderHeaderBlock(
  b: LayoutBuilder,
  spec: TemplateSpec,
  resume: Resume,
  fp: FontPreset,
  c: ThemeColors,
  column?: { x: number; w: number }
): void {
  const info = resume.personalInfo
  const w = column?.w ?? b.contentW
  const x = column?.x ?? b.x
  const name = info.fullName || 'Your Name'
  const displayName = spec.uppercaseName ? name.toUpperCase() : name
  const contact = contactLine(resume, spec.header === 'split' ? '\n' : '  ·  ')

  const nameRef: EditRef = { kind: 'personal-info', field: 'fullName' }
  const headlineRef: EditRef = { kind: 'personal-info', field: 'headline' }

  const nameSize = fp.scale.name
  const nameH = nameSize * fp.lineHeight.heading
  const headlineH = fp.scale.headline * fp.lineHeight.body
  // Measured, not assumed to be one line. At full width the contact string fits
  // on one; in the narrower main column of a two-column layout it wraps, and a
  // fixed single-line box let the first section render on top of it.
  const contactLineH = fp.scale.small * 1.55
  const contactH = contact ? estimateTextHeight(contact, w, fp.scale.small, 1.55) : contactLineH

  const text = (
    xPt: number, yPt: number, wPt: number, hPt: number,
    styles: Partial<LayoutStyles>, content: string, editRef?: EditRef
  ) => b.node('text', xPt, yPt, wPt, hPt, styles, { content, editRef })

  const nameStyle = (align: LayoutStyles['textAlign']): Partial<LayoutStyles> => ({
    fontFamily: fp.headingFamily,
    fontSize: nameSize,
    fontWeight: displayWeight(fp.headingFamily),
    color: c.textPrimary,
    lineHeight: fp.lineHeight.heading,
    textAlign: align,
    letterSpacing: spec.uppercaseName ? 0.04 : 0,
  })
  const headlineStyle = (align: LayoutStyles['textAlign']): Partial<LayoutStyles> => ({
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.headline,
    fontWeight: 500,
    color: c.primary,
    lineHeight: fp.lineHeight.body,
    textAlign: align,
  })
  const contactStyle = (align: LayoutStyles['textAlign']): Partial<LayoutStyles> => ({
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.small,
    fontWeight: 400,
    color: c.textSecondary,
    lineHeight: 1.55,
    textAlign: align,
  })

  // Reserve the whole header so it can never straddle a page break.
  const photo = resume.settings.showProfileImage && info.profileImage ? 54 : 0
  b.ensureSpace(nameH + headlineH + contactH + 40 + (spec.header === 'banner' ? 20 : 0))

  switch (spec.header) {
    case 'banner': {
      const padY = 14
      const bandH = nameH + (info.headline ? headlineH + 2 : 0) + padY * 2
      const bleed = 10
      b.currentPage.nodes.push(
        b.node('rect', x - bleed, b.y - bleed, w + bleed * 2, bandH, { backgroundColor: c.primary })
      )
      b.currentPage.nodes.push(text(x, b.y + padY - bleed, w, nameH,
        { ...nameStyle('left'), color: '#ffffff' }, displayName, nameRef))
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y + padY - bleed + nameH + 2, w, headlineH,
          { ...headlineStyle('left'), color: '#ffffff' }, info.headline, headlineRef))
      }
      b.advanceY(bandH - bleed + 10)
      if (contact) {
        b.currentPage.nodes.push(text(x, b.y, w, contactH, contactStyle('left'), contact))
        b.advanceY(contactH)
      }
      break
    }

    case 'split': {
      // Name column and contact column share a top edge; the taller of the two
      // sets the block height so the rule underneath never clips either.
      const contactLines = [info.location, info.phone, info.email, displayUrl(info.website || info.linkedin)].filter(Boolean)
      const rightW = Math.min(190, w * 0.42)
      const leftW = w - rightW - 20
      b.currentPage.nodes.push(text(x, b.y, leftW, nameH, nameStyle('left'), displayName, nameRef))
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y + nameH + 2, leftW, headlineH, headlineStyle('left'), info.headline, headlineRef))
      }
      contactLines.forEach((line, i) => {
        b.currentPage.nodes.push(text(x + leftW + 20, b.y + i * contactLineH, rightW, contactLineH,
          contactStyle('right'), line))
      })
      const leftH = nameH + (info.headline ? headlineH + 2 : 0)
      b.advanceY(Math.max(leftH, contactLines.length * contactLineH) + 10)
      break
    }

    case 'centered': {
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('center'), displayName, nameRef))
      b.advanceY(nameH + 3)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('center'), info.headline, headlineRef))
        b.advanceY(headlineH + 5)
      }
      if (contact) {
        b.currentPage.nodes.push(text(x, b.y, w, contactH, contactStyle('center'), contact))
        b.advanceY(contactH + 8)
      }
      break
    }

    case 'rule': {
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 1, { color: c.primary }))
      b.advanceY(9)
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('center'), displayName, nameRef))
      b.advanceY(nameH + 6)
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 1, { color: c.primary }))
      b.advanceY(9)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('center'), info.headline, headlineRef))
        b.advanceY(headlineH + 3)
      }
      if (contact) {
        b.currentPage.nodes.push(text(x, b.y, w, contactH, contactStyle('center'), contact))
        b.advanceY(contactH + 6)
      }
      break
    }

    case 'monogram': {
      const tile = 46
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
      b.currentPage.nodes.push(b.node('rect', x, b.y, tile, tile, { backgroundColor: c.primary }))
      b.currentPage.nodes.push(text(x, b.y + (tile - fp.scale.name) / 2 - 1, tile, fp.scale.name * 1.2, {
        fontFamily: fp.headingFamily,
        fontSize: fp.scale.name * 0.72,
        fontWeight: 700,
        color: '#ffffff',
        lineHeight: 1.2,
        textAlign: 'center',
      }, initials || 'AM'))
      const textX = x + tile + 14
      const textW = w - tile - 14
      b.currentPage.nodes.push(text(textX, b.y, textW, nameH, nameStyle('left'), displayName, nameRef))
      if (info.headline) {
        b.currentPage.nodes.push(text(textX, b.y + nameH + 1, textW, headlineH, headlineStyle('left'), info.headline, headlineRef))
      }
      b.advanceY(Math.max(tile, nameH + (info.headline ? headlineH + 1 : 0)) + 9)
      if (contact) {
        b.currentPage.nodes.push(text(x, b.y, w, contactH, contactStyle('left'), contact))
        b.advanceY(contactH + 8)
      }
      break
    }

    case 'stacked':
    default: {
      const textW = photo ? w - photo - 14 : w
      b.currentPage.nodes.push(text(x, b.y, textW, nameH, nameStyle('left'), displayName, nameRef))
      if (photo && info.profileImage) {
        b.currentPage.nodes.push(b.node('image', x + w - photo, b.y, photo, photo,
          { backgroundColor: c.surfaceElevated }, { imageId: info.profileImage, clipShape: 'circle' }))
      }
      b.advanceY(nameH + 3)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, textW, headlineH, headlineStyle('left'), info.headline, headlineRef))
        b.advanceY(headlineH + 6)
      }
      if (contact) {
        b.currentPage.nodes.push(text(x, b.y, textW, contactH, contactStyle('left'), contact))
        b.advanceY(contactH + 9)
      }
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 1.4, { color: c.primary }))
      b.advanceY(4)
      break
    }
  }

  b.advanceY(METRICS[spec.density].headerGap)
}

// ─── Section header variants ──────────────────────────────────────────────────

/**
 * Every variant returns its own height, and `placeEntryBlock` re-invokes this
 * for continuation headers — so a section that spills onto the next page keeps
 * identical chrome and identical spacing.
 */
function buildSectionHeader(
  b: LayoutBuilder,
  spec: TemplateSpec,
  fp: FontPreset,
  c: ThemeColors,
  w: number,
  title: string,
  continued: boolean,
  icon: IconName | undefined
): SectionHeaderResult {
  const label = continued ? `${title} (continued)` : title
  const shown = spec.uppercaseSectionTitles ? label.toUpperCase() : label
  const size = fp.scale.sectionTitle
  const nodes: LayoutNode[] = []

  /**
   * Measure rather than assume one line. A long title ("Professional
   * Experience", or any title plus "(continued)") wraps, and a header that
   * reports a single line's height lets the first entry render on top of it.
   */
  const tracking = spec.uppercaseSectionTitles ? 0.08 : 0
  const measure = (widthPt: number) =>
    Math.max(
      size * fp.lineHeight.heading,
      estimateStyledTextHeight(shown, widthPt, size, fp.lineHeight.heading, tracking)
    )
  const titleH = measure(w)

  const titleStyle: Partial<LayoutStyles> = {
    fontFamily: fp.headingFamily,
    fontSize: size,
    fontWeight: 700,
    color: c.textPrimary,
    lineHeight: fp.lineHeight.heading,
    textAlign: 'left',
    letterSpacing: spec.uppercaseSectionTitles ? 0.08 : 0,
  }
  const t = (x: number, y: number, width: number, h: number, s: Partial<LayoutStyles>, content: string) =>
    b.node('text', x, y, width, h, s, { content })

  switch (spec.sectionHeader) {
    case 'caps-rule': {
      // Rule starts after the words rather than under them, so the title reads
      // as a label on a line instead of an underlined heading. The text column
      // is wide enough that ordinary titles never wrap; if one does, the
      // measured height below keeps the rule and the entries clear of it.
      // Sized from the same glyph metric the measurement uses, so an ordinary
      // title occupies one line and the rule starts right after the words.
      const textW = Math.min(w * 0.72, avgGlyphWidth(shown, size, tracking) * shown.length + 10)
      const h = measure(textW)
      const lineH = size * fp.lineHeight.heading
      nodes.push(t(0, 0, textW, h, { ...titleStyle, color: c.primary }, shown))
      nodes.push(b.node('divider', textW + 8, lineH / 2, Math.max(0, w - textW - 8), 1, { color: c.divider }))
      return { nodes, height: h + 9 }
    }

    case 'bar': {
      const barH = 3
      nodes.push(b.node('rect', 0, 0, 26, barH, { backgroundColor: c.primary }))
      nodes.push(t(0, barH + 7, w, titleH, titleStyle, shown))
      return { nodes, height: barH + 7 + titleH + 8 }
    }

    case 'boxed': {
      const padX = 9
      const padY = 4
      const boxedH = measure(w - padX * 2)
      const bandH = boxedH + padY * 2
      nodes.push(b.node('rect', 0, 0, w, bandH, { backgroundColor: c.surfaceElevated }))
      nodes.push(t(padX, padY, w - padX * 2, boxedH, { ...titleStyle, color: c.primary }, shown))
      return { nodes, height: bandH + 9 }
    }

    case 'icon': {
      const iconSize = size * fp.lineHeight.heading * 0.9
      const iconH = measure(w - iconSize - 8)
      nodes.push(b.node('icon', 0, (size * fp.lineHeight.heading - iconSize) / 2, iconSize, iconSize, { color: c.primary },
        { iconName: icon ?? 'user', iconEditable: true }))
      nodes.push(t(iconSize + 8, 0, w - iconSize - 8, iconH, titleStyle, shown))
      nodes.push(b.node('divider', 0, iconH + 5, w, 1, { color: c.divider }))
      return { nodes, height: iconH + 5 + 10 }
    }

    case 'side-label': {
      const tick = 3
      const sideH = measure(w - tick - 9)
      nodes.push(b.node('rect', 0, 2, tick, sideH - 4, { backgroundColor: c.primary }))
      nodes.push(t(tick + 9, 0, w - tick - 9, sideH, { ...titleStyle, fontSize: size * 0.94 }, shown))
      return { nodes, height: sideH + 8 }
    }

    case 'plain':
      nodes.push(t(0, 0, w, titleH, titleStyle, shown))
      return { nodes, height: titleH + 8 }

    case 'underline':
    default:
      nodes.push(t(0, 0, w, titleH, titleStyle, shown))
      nodes.push(b.node('divider', 0, titleH + 4, w, 1, { color: c.divider }))
      return { nodes, height: titleH + 4 + 9 }
  }
}

// ─── Section dispatch ─────────────────────────────────────────────────────────

function renderSection(
  b: LayoutBuilder,
  spec: TemplateSpec,
  sectionType: SectionType,
  resume: Resume,
  template: TemplateDefinition,
  fp: FontPreset,
  c: ThemeColors,
  forceBlack: boolean,
  column?: { x: number; w: number }
): void {
  const w = column?.w ?? b.contentW
  const x = column?.x ?? b.x
  const m = METRICS[spec.density]
  const title = spec.titles?.[sectionType] ?? DEFAULT_TITLES[sectionType]

  const bodyFor: Partial<LayoutStyles> = {
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.body,
    fontWeight: 400,
    color: c.textPrimary,
    lineHeight: fp.lineHeight.body,
    textAlign: 'left',
  }

  const headerFor = (headerTitle: string, customId?: string) => (continued: boolean) =>
    buildSectionHeader(b, spec, fp, c, w, headerTitle, continued,
      spec.sectionHeader === 'icon'
        ? resolveSectionIcon(resume, sectionType, template.sectionIcons?.[sectionType] ?? 'user', customId)
        : undefined)

  const place = (entries: EntryResult[], gap: number, headerTitle = title, customId?: string) => {
    if (!entries.length) return
    placeEntryBlock(b, sectionType, x, w, entries, gap, headerFor(headerTitle, customId), bodyFor)
    b.advanceY(m.sectionGap)
  }

  switch (sectionType) {
    case 'summary': {
      if (!resume.summary.visible || !resume.summary.content) return
      const h = estimateTextHeight(resume.summary.content, w, fp.scale.body, 1.5)
      place([{
        nodes: [b.node('text', 0, 0, w, h, { ...bodyFor, lineHeight: 1.5, color: c.textSecondary },
          { content: resume.summary.content, editRef: { kind: 'summary' } })],
        height: h,
      }], 0)
      break
    }
    case 'experience': {
      const visible = resume.experience.filter((e) => e.visible)
      if (spec.timeline) {
        // The rail is drawn per entry rather than as one long line: entries are
        // repositioned by placeEntryBlock when a section breaks across pages,
        // so a single line measured up front would be left pointing at nothing.
        const rail = 14
        const dot = 5
        const timed = visible.map((e) => {
          const built = buildExperienceEntry(b, e, w - rail, c, fp, forceBlack)
          const shifted = built.nodes.map((n) => ({ ...n, xPt: n.xPt + rail }))
          return {
            ...built,
            nodes: [
              b.node('rect', (rail - 1) / 2, 0, 1, built.height, { backgroundColor: c.divider }),
              b.node('rect', (rail - dot - 4) / 2, fp.scale.entryTitle * 0.5 - 2, dot + 4, dot + 4,
                { backgroundColor: '#ffffff' }, { clipShape: 'circle' }),
              b.node('rect', (rail - dot) / 2, fp.scale.entryTitle * 0.5, dot, dot,
                { backgroundColor: c.primary }, { clipShape: 'circle' }),
              ...shifted,
            ],
          }
        })
        place(timed, m.entryGap)
      } else {
        place(visible.map((e) => buildExperienceEntry(b, e, w, c, fp, forceBlack)), m.entryGap)
      }
      break
    }
    case 'education':
      place(resume.education.filter((e) => e.visible).map((e) => buildEducationEntry(b, e, w, c, fp, forceBlack)), m.entryGap - 2)
      break
    case 'skills': {
      const visible = resume.skills.filter((s) => s.visible)
      if (spec.skills === 'meter') {
        // One bar per named skill rather than one pill-row per group.
        const bars = visible.flatMap((group) =>
          group.skills.map((skill) => buildSkillBar(b, skill, w, c.primary, c.divider, c.textPrimary, fp))
        )
        place(bars, 2)
      } else {
        place(visible.map((sk) => buildSkillPills(b, sk, w, c, fp, forceBlack)), m.entryGap - 4)
      }
      break
    }
    case 'projects':
      place(resume.projects.filter((p) => p.visible).map((p) => buildProjectEntry(b, p, w, c, fp, forceBlack)), m.entryGap)
      break
    case 'certifications':
      place(resume.certifications.filter((cert) => cert.visible).map((cert) => buildCertEntry(b, cert, w, c, fp, forceBlack)), m.entryGap - 4)
      break
    case 'custom': {
      // Each custom section is its own titled block, so they never merge.
      for (const cs of resume.customSections.filter((s) => s.visible && s.items.length > 0)) {
        const text = cs.items.map((i) => i.title).join(', ')
        const h = estimateTextHeight(text, w, fp.scale.body, 1.5)
        place([{ nodes: [b.node('text', 0, 0, w, h, { ...bodyFor, lineHeight: 1.5 }, { content: text })], height: h }],
          0, cs.title, cs.id)
      }
      break
    }
  }
}



/**
 * Full-bleed band across the head of page one: a circular portrait at the left,
 * the name and role reversed out beside it. Returns the Y the columns start at.
 *
 * Drawn edge to edge rather than inside the text column — the band is the top
 * of the page, and boxing it into the margins loses the whole effect. Page one
 * only: on later pages the band would be a header repeating with no name to
 * introduce.
 */
function renderPhotoBand(
  b: LayoutBuilder, spec: TemplateSpec, resume: Resume, fp: FontPreset
): number {
  const info = resume.personalInfo
  const bandH = 132
  const pad = b.margins.left
  const photo = 92
  const hasPhoto = !!(resume.settings.showProfileImage && info.profileImage)

  b.currentPage.nodes.push(b.node('rect', 0, 0, b.pageW, bandH, { backgroundColor: spec.accent }))

  const photoX = pad
  const photoY = (bandH - photo) / 2
  if (hasPhoto) {
    b.currentPage.nodes.push(b.node('image', photoX, photoY, photo, photo,
      { backgroundColor: '#ffffff' }, { imageId: info.profileImage, clipShape: 'circle' }))
  } else {
    // Keeps the composition when no portrait is set, rather than leaving a hole.
    const initials = (info.fullName || 'Your Name').split(/\s+/).filter(Boolean)
      .slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
    b.currentPage.nodes.push(b.node('rect', photoX, photoY, photo, photo,
      { backgroundColor: 'rgb(255 255 255 / 16%)' }, { clipShape: 'circle' }))
    b.currentPage.nodes.push(b.node('text', photoX, photoY + (photo - fp.scale.name) / 2, photo, fp.scale.name * 1.25, {
      fontFamily: fp.headingFamily,
      fontSize: fp.scale.name * 0.92,
      fontWeight: 700,
      color: '#ffffff',
      lineHeight: 1.25,
      textAlign: 'center',
    }, { content: initials || 'YN' }))
  }

  const textX = photoX + photo + 22
  const textW = b.pageW - textX - pad
  const name = (info.fullName || 'Your Name').toUpperCase()
  const nameSize = fp.scale.name * 1.12
  const nameH = estimateStyledTextHeight(name, textW, nameSize, fp.lineHeight.heading, 0.04)
  const roleH = fp.scale.headline * fp.lineHeight.body
  const blockH = nameH + (info.headline ? roleH + 6 : 0)
  const blockY = (bandH - blockH) / 2

  b.currentPage.nodes.push(b.node('text', textX, blockY, textW, nameH, {
    fontFamily: fp.headingFamily,
    fontSize: nameSize,
    fontWeight: displayWeight(fp.headingFamily),
    color: '#ffffff',
    lineHeight: fp.lineHeight.heading,
    textAlign: 'left',
    letterSpacing: 0.04,
  }, { content: name, editRef: { kind: 'personal-info', field: 'fullName' } }))

  if (info.headline) {
    b.currentPage.nodes.push(b.node('text', textX, blockY + nameH + 6, textW, roleH, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.headline,
      fontWeight: 500,
      color: 'rgb(255 255 255 / 82%)',
      lineHeight: fp.lineHeight.body,
      textAlign: 'left',
      letterSpacing: 0.12,
    }, { content: info.headline.toUpperCase(), editRef: { kind: 'personal-info', field: 'headline' } }))
  }

  return bandH
}

// ─── Two-column ───────────────────────────────────────────────────────────────

/** Contact rows for the panel, one line each so a narrow column can hold them. */
function renderPanelContact(
  b: LayoutBuilder, resume: Resume, x: number, w: number, fp: FontPreset, c: ThemeColors
): void {
  const i = resume.personalInfo
  const rows = [i.phone, i.email, i.location, displayUrl(i.website), displayUrl(i.linkedin)].filter(Boolean)
  for (const row of rows) {
    const h = estimateTextHeight(row, w, fp.scale.small, 1.45)
    b.currentPage.nodes.push(b.node('text', x, b.y, w, h, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.small,
      fontWeight: 400,
      color: c.textSecondary,
      lineHeight: 1.45,
      textAlign: 'left',
    }, { content: row }))
    b.advanceY(h + 4)
  }
  b.advanceY(8)
}

/**
 * Panel + main column.
 *
 * The panel is rendered first and is not allowed to paginate: `LayoutBuilder`
 * only ever appends to the last page, so whichever column runs second would
 * otherwise land entirely on the final page once the first one overflowed.
 * The panel is the short column by construction, so the main column is the one
 * that spills.
 */
function renderTwoColumn(
  b: LayoutBuilder,
  spec: TemplateSpec,
  resume: Resume,
  template: TemplateDefinition,
  fp: FontPreset,
  c: ThemeColors,
  forceBlack: boolean
): void {
  const sb = spec.sidebar
  if (!sb) return
  const left = spec.body === 'sidebar-left'
  const panelW = b.pageW * sb.widthPct
  const pad = 18
  const gutter = 22

  const panelX = left ? 0 : b.pageW - panelW
  const colX = panelX + pad
  const colW = panelW - pad * 2
  const mainX = left ? panelW + gutter : b.margins.left
  const mainW = b.pageW - panelW - gutter - b.margins.left

  // Reversed-out panels need their own ink; a tinted one keeps the body colours.
  const panelC: ThemeColors = sb.tone === 'dark'
    ? { ...c, textPrimary: '#ffffff', textSecondary: 'rgb(255 255 255 / 78%)', textMuted: 'rgb(255 255 255 / 62%)', divider: 'rgb(255 255 255 / 22%)', primary: '#ffffff' }
    : c

  // The band spans both columns, so it is drawn before either and pushes the
  // shared start line down.
  const bandH = spec.header === 'band-photo' ? renderPhotoBand(b, spec, resume, fp) : 0
  const top = bandH ? bandH + 20 : b.margins.top
  b.seekY(top)

  const hasPhoto = !!(sb.photo && resume.settings.showProfileImage && resume.personalInfo.profileImage)
  if (hasPhoto && sb.photo === 'bleed') {
    // Flush to the panel's own edges, top included — the portrait becomes the
    // top of the page rather than an element placed on it.
    const h = panelW * 1.15
    b.currentPage.nodes.push(b.node('image', panelX, 0, panelW, h,
      { backgroundColor: c.surfaceElevated }, { imageId: resume.personalInfo.profileImage }))
    b.seekY(h + 20)
  } else if (hasPhoto) {
    const size = Math.min(colW, 88)
    b.currentPage.nodes.push(b.node('image', colX + (colW - size) / 2, b.y, size, size,
      { backgroundColor: c.surfaceElevated },
      { imageId: resume.personalInfo.profileImage, clipShape: 'circle' }))
    b.advanceY(size + 16)
  }

  if (sb.nameInPanel) {
    const name = resume.personalInfo.fullName || 'Your Name'
    const nameH = estimateStyledTextHeight(name, colW, fp.scale.name * 0.82, fp.lineHeight.heading)
    b.currentPage.nodes.push(b.node('text', colX, b.y, colW, nameH, {
      fontFamily: fp.headingFamily,
      fontSize: fp.scale.name * 0.82,
      fontWeight: 700,
      color: panelC.textPrimary,
      lineHeight: fp.lineHeight.heading,
      textAlign: 'left',
    }, { content: name, editRef: { kind: 'personal-info', field: 'fullName' } }))
    b.advanceY(nameH + 2)
    if (resume.personalInfo.headline) {
      const hlH = estimateTextHeight(resume.personalInfo.headline, colW, fp.scale.headline * 0.9, fp.lineHeight.body)
      b.currentPage.nodes.push(b.node('text', colX, b.y, colW, hlH, {
        fontFamily: fp.bodyFamily,
        fontSize: fp.scale.headline * 0.9,
        fontWeight: 500,
        color: panelC.textSecondary,
        lineHeight: fp.lineHeight.body,
        textAlign: 'left',
      }, { content: resume.personalInfo.headline, editRef: { kind: 'personal-info', field: 'headline' } }))
      b.advanceY(hlH + 14)
    }
  }

  if (!spec.footerContact) renderPanelContact(b, resume, colX, colW, fp, panelC)

  const panelSections = new Set(sb.sections)
  for (const sectionType of resume.sectionOrder) {
    if (panelSections.has(sectionType)) {
      renderSection(b, spec, sectionType, resume, template, fp, panelC, forceBlack, { x: colX, w: colW })
    }
  }
  const panelEndY = b.y

  b.seekY(top)
  if (!sb.nameInPanel && !bandH) renderHeaderBlock(b, spec, resume, fp, c, { x: mainX, w: mainW })
  for (const sectionType of resume.sectionOrder) {
    if (!panelSections.has(sectionType)) {
      renderSection(b, spec, sectionType, resume, template, fp, c, forceBlack, { x: mainX, w: mainW })
    }
  }
  const mainEndY = b.y

  // Painted on every page, behind the content: drawing it only on page one
  // left reversed-out panel text on bare white paper wherever the resume ran
  // past a single page.
  const fill = sb.tone === 'dark' ? spec.accent : (spec.band ?? tintColor(spec.accent, 0.93))
  b.allPages.forEach((page, i) => {
    // Page one starts below the band; later pages have no band to clear.
    const panelTop = i === 0 ? bandH : 0
    page.nodes.unshift(b.node('rect', panelX, panelTop, panelW, b.pageH - panelTop, { backgroundColor: fill }))
  })

  b.seekY(Math.max(panelEndY, mainEndY))
}


/**
 * Contact strip across the foot of every page.
 *
 * Height is capped to the bottom margin so it occupies space the text column
 * already leaves empty — the layout needs no other adjustment, and the strip
 * can never collide with content.
 */
function renderFooterContact(
  b: LayoutBuilder, resume: Resume, spec: TemplateSpec, fp: FontPreset, c: ThemeColors
): void {
  const i = resume.personalInfo
  const line = [i.phone, i.email, displayUrl(i.website || i.linkedin), i.location]
    .filter(Boolean)
    .join('     ')
  if (!line) return

  const barH = Math.min(b.margins.bottom, 34)
  const dark = spec.sidebar?.tone === 'dark' || spec.body === 'single'
  const fill = dark ? spec.accent : (spec.band ?? tintColor(spec.accent, 0.9))
  const ink = dark ? '#ffffff' : c.textPrimary

  for (const page of b.allPages) {
    page.nodes.push(
      b.node('rect', 0, page.heightPt - barH, page.widthPt, barH, { backgroundColor: fill }),
      b.node('text', b.margins.left, page.heightPt - barH + (barH - fp.scale.small * 1.4) / 2,
        page.widthPt - b.margins.left * 2, fp.scale.small * 1.4, {
          fontFamily: fp.bodyFamily,
          fontSize: fp.scale.small,
          fontWeight: 500,
          color: ink,
          lineHeight: 1.4,
          textAlign: 'center',
        }, { content: line })
    )
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Every spec built here, so the catalog can be checked for two templates
 * wearing the same design rather than that being a matter of opinion.
 */
const specs = new Map<string, TemplateSpec>()

export function registeredSpecs(): ReadonlyMap<string, TemplateSpec> {
  return specs
}

export function createTemplateRenderer(spec: TemplateSpec): TemplateRenderFn {
  specs.set(spec.id, spec)

  return function render(resume, template, theme, fp): LayoutTree {
    const forceBlack = template.exportRules.forceBlackText
    const colors = resolvePalette(spec, theme, forceBlack)

    // Same rule as the accent: the template supplies its typeface unless the
    // user has picked a font preset, in which case theirs wins. Derived once
    // and passed everywhere so the shared entry builders match the header.
    const usesDefaultFont = fp.id === 'professional'
    const fpx: FontPreset = usesDefaultFont
      ? {
          ...fp,
          headingFamily: spec.headingFamily ?? fp.headingFamily,
          bodyFamily: spec.bodyFamily ?? fp.bodyFamily,
        }
      : fp
    const builder = new LayoutBuilder({
      resumeId: resume.id,
      templateId: template.id,
      themeId: theme.id,
      fontPresetId: fp.id,
      pageSize: resume.settings.pageSize,
      marginMm: spec.marginMm,
    })

    if (spec.body === 'sidebar-left' || spec.body === 'sidebar-right') {
      renderTwoColumn(builder, spec, resume, template, fpx, colors, forceBlack)
    } else {
      renderHeaderBlock(builder, spec, resume, fpx, colors)
      for (const sectionType of resume.sectionOrder) {
        renderSection(builder, spec, sectionType, resume, template, fpx, colors, forceBlack)
      }
    }

    // After the columns, so every page it decorates already exists.
    if (spec.footerContact) renderFooterContact(builder, resume, spec, fpx, colors)

    return builder.build()
  }
}
