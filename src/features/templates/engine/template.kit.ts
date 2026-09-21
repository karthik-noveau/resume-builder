import type { Resume, SectionType } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontFamily, FontPreset } from '@/shared/types/font.types'
import type { LayoutTree, LayoutNode, LayoutStyles, EditRef, IconName } from '@/shared/types/layout.types'
import { CUSTOM_THEME_ID } from '@/shared/stores/theme.store'
import { getTemplateColorConfiguration, resolveTemplateColors, type TemplateColorValues } from '@/shared/utils/templateColors'
import { LayoutBuilder } from './layout.builder'
import {
  buildExperienceEntry,
  buildEducationEntry,
  buildSkillPills,
  buildSkillBar,
  buildRatedSkillGroup,
  buildProjectEntry,
  buildCertEntry,
  placeEntryBlock,
  type EntryResult,
  type SectionHeaderResult,
} from './section.renderers'
import { applyResumeTypography, estimateTextHeight, estimateStyledTextHeight, estimateWrappedTextHeight, avgGlyphWidth, resolveTemplateTypography } from './layout.utils'
import { buildContactLineNodes, contactItems, measureContactHeight } from './contact.layout'
import { resolveSectionIcon } from './icons'
import type { TemplateRenderFn } from './template.renderer'
import { contrastInk, renderEditorialLayout, type EditorialSpec } from './editorial.layout'
import { measureTextWidth } from '@/shared/utils/textMeasurement'

/**
 * Declarative resume template kit.
 *
 * Every template built here shares one measurement, placement and pagination
 * path. Each design specifies its page structure, identity block, section
 * treatments, typography, and palette while reusing the placement rules.
 * Independent column cursors preserve both columns when either paginates.
 *
 * Single-column and sidebar layouts share the same content and type system.
 */

// ─── Spec ─────────────────────────────────────────────────────────────────────

export type HeaderVariant =
  | 'stacked'   // name left, headline under it, contact row, rule beneath
  | 'centered'  // name and contact centred — the classic consulting/banking sheet
  | 'banner'    // name reversed out of a full-width accent band
  | 'split'     // name left, contact stacked right, aligned to a shared baseline
  | 'rule'      // name between two hairlines, contact centred under
  | 'monogram'  // initials tile beside the name block
  | 'editorial' // headline above a serif nameplate with a slim accent rule
  | 'accent-rule' // substantial top rule, generous left-aligned name
  | 'nameplate' // inset name and role inside an outlined frame
  | 'right-aligned' // asymmetrical, right-aligned identity with a short accent
  | 'masthead' // open nameplate with a tinted contact strip beneath
  | 'minimal' // unadorned identity, with separation carried by whitespace
  | 'ribbon' // role on a tinted ribbon above the name
  | 'seal' // centered circular initials above the name
  | 'band-photo' // full-bleed dark band across the top holding a circular portrait, name and role

export type SectionHeaderVariant =
  | 'badge'
  | 'outline-label'
  | 'block-label'
  | 'editorial-rule'
  | 'underline'  // title with a hairline directly beneath
  | 'caps-rule'  // letterspaced caps, rule to the right of the words
  | 'bar'        // short accent bar above the title
  | 'boxed'      // title on a tinted full-width band
  | 'icon'       // section icon then title, hairline beneath
  | 'side-label' // small caps title with a leading accent tick
  | 'plain'      // title alone, spacing carries the separation
  | 'split-rule' // centered label between two fine rules
  | 'tab'        // compact tinted label instead of a full-width band
  | 'overline'   // rule above the heading
  | 'numbered'   // a small section index beside the title
  | 'bracket'    // a fine L-shaped mark beside the heading

export type Density = 'compact' | 'regular' | 'roomy'

/**
 * The page's overall shape. This is what actually distinguishes one template
 * from another — header and section-title treatments are detail by comparison,
 * and a catalog that varies only those reads as one design recoloured.
 */
export type BodyLayout = 'single' | 'sidebar-left' | 'sidebar-right' | 'columns-left' | 'columns-right' | 'index-rail'

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
  /** Typeface identity, overridden when the user picks a font preset. */
  headingFamily?: FontFamily
  bodyFamily?: FontFamily
  /** Optional type scale for the template's default presentation. A user's
   * explicit font-preset choice still replaces it in full. */
  defaultScale?: Partial<FontPreset['scale']>
  defaultLineHeight?: Partial<FontPreset['lineHeight']>
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
  editorial?: EditorialSpec
  sidebar?: SidebarSpec
  /** Open columns begin beneath a full-width identity block. */
  introFullWidth?: boolean
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
  compact: { sectionGap: 16, entryGap: 12, headerGap: 16 },
  regular: { sectionGap: 18, entryGap: 12, headerGap: 18 },
  roomy: { sectionGap: 20, entryGap: 14, headerGap: 22 },
}

function metricsFor(spec: TemplateSpec, resume: Resume): Metrics {
  const preference = resume.settings.spacingDensity ?? 'balanced'
  const density: Density = preference === 'compact'
    ? 'compact'
    : preference === 'spacious' ? 'roomy' : spec.density
  return METRICS[density]
}

// ─── Colour ───────────────────────────────────────────────────────────────────

/**
 * The template owns ink, rules and its accent; a colour the user picks for a
 * resume overrides the accent.
 */
export type ResolvedPalette = ThemeColors & Pick<TemplateColorValues,
  | 'panelBackground' | 'panelText' | 'panelSecondaryText'
  | 'sectionTitle' | 'sectionDescription' | 'sectionBorder' | 'sectionIcon' | 'sectionBackground'
>

function resolvePalette(spec: TemplateSpec, resume: Resume, theme: Theme, forceBlack: boolean): ResolvedPalette {
  // Share the palette with the appearance inspector so panel fills and text
  // colours agree with the values users see when they customise a template.
  const defaults = getTemplateColorConfiguration(spec.id).defaults
  const selected = resolveTemplateColors(resume, {
    ...defaults,
    accent: theme.id === CUSTOM_THEME_ID ? theme.colors.primary : defaults.accent,
  })
  const accent = forceBlack ? '#000000' : selected.accent
  return {
    primary: accent,
    primaryHover: theme.colors.primaryHover,
    primaryActive: theme.colors.primaryActive,
    background: '#ffffff',
    surface: '#ffffff',
    surfaceElevated: selected.softBackground,
    textPrimary: forceBlack ? '#000000' : selected.primaryText,
    textSecondary: forceBlack ? '#000000' : selected.sectionDescription,
    textMuted: forceBlack ? '#000000' : selected.mutedText,
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0284c7',
    accent,
    divider: selected.divider,
    panelBackground: selected.panelBackground,
    panelText: selected.panelText,
    panelSecondaryText: selected.panelSecondaryText,
    sectionTitle: forceBlack ? '#000000' : selected.sectionTitle,
    sectionDescription: forceBlack ? '#000000' : selected.sectionDescription,
    sectionBorder: forceBlack ? '#000000' : selected.sectionBorder,
    sectionIcon: forceBlack ? '#000000' : selected.sectionIcon,
    sectionBackground: selected.sectionBackground,
  }
}


// ─── Header variants ──────────────────────────────────────────────────────────

function renderHeaderBlock(
  b: LayoutBuilder,
  spec: TemplateSpec,
  resume: Resume,
  fp: FontPreset,
  c: ResolvedPalette,
  column?: { x: number; w: number }
): void {
  const info = resume.personalInfo
  const w = column?.w ?? b.contentW
  const x = column?.x ?? b.x
  const name = info.fullName || 'Your Name'
  const displayName = spec.uppercaseName ? name.toUpperCase() : name
  const primaryUrl = info.website ? 'website' : 'linkedin'
  const contacts = column || spec.footerContact
    ? []
    : contactItems(info, ['location', 'phone', 'email', primaryUrl])

  const nameRef: EditRef = { kind: 'personal-info', field: 'fullName' }
  const headlineRef: EditRef = { kind: 'personal-info', field: 'headline' }

  const nameSize = fp.scale.name
  const photo = !column && resume.settings.showProfileImage && info.profileImage ? 56 : 0
  const splitRightW = Math.min(176, w * 0.38)
  const nameW = spec.header === 'split' ? w - splitRightW - 24
    : spec.header === 'monogram' ? w - 68
      : spec.header === 'banner' || spec.header === 'nameplate' ? w - 36
        : spec.header === 'editorial' ? w - 16
        : photo ? w - photo - 18 : w
  // A narrow nameplate can wrap earlier at word boundaries, especially beside
  // a monogram. Reserve those lines before positioning the headline beneath it.
  const nameH = Math.max(
    estimateStyledTextHeight(displayName, nameW, nameSize, fp.lineHeight.heading, spec.uppercaseName ? 0.04 : 0, fp.headingFamily, fp.headingFamily === 'IBMPlexSans' ? 600 : 700),
    estimateWrappedTextHeight(displayName, nameW, nameSize, fp.lineHeight.heading, fp.headingFamily, fp.headingFamily === 'IBMPlexSans' ? 600 : 700)
  )
  const headlineH = Math.max(
    estimateTextHeight(info.headline, nameW, fp.scale.headline, fp.lineHeight.body, fp.bodyFamily),
    estimateWrappedTextHeight(info.headline, nameW, fp.scale.headline, fp.lineHeight.body, fp.bodyFamily)
  )
  // Measured, not assumed to be one line. At full width the contact string fits
  // on one; in the narrower main column of a two-column layout it wraps, and a
  // fixed single-line box let the first section render on top of it.
  const contactLineH = fp.scale.small * 1.55
  const contactH = spec.header === 'split'
    ? Math.max(contactLineH, contacts.length * contactLineH)
    : Math.max(contactLineH, measureContactHeight(contacts, w, fp.scale.small, 1.55))

  const text = (
    xPt: number, yPt: number, wPt: number, hPt: number,
    styles: Partial<LayoutStyles>, content: string, editRef?: EditRef
  ) => b.node('text', xPt, yPt, wPt, hPt, styles, { content, editRef })

  const nameStyle = (align: LayoutStyles['textAlign']): Partial<LayoutStyles> => ({
    fontFamily: fp.headingFamily,
    fontSize: nameSize,
    fontWeight: fp.headingFamily === 'IBMPlexSans' ? 600 : 700,
    color: c.textPrimary,
    lineHeight: fp.lineHeight.heading,
    textAlign: align,
    letterSpacing: spec.uppercaseName ? 0.04 : 0,
  })
  const headlineStyle = (align: LayoutStyles['textAlign']): Partial<LayoutStyles> => ({
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.headline,
    fontWeight: 400,
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

  const pushContactLine = (
    lineX: number,
    lineY: number,
    lineW: number,
    align: LayoutStyles['textAlign'],
    separator = '  ·  '
  ): number => {
    const line = buildContactLineNodes(b, contacts, lineX, lineY, lineW, contactStyle(align), separator)
    b.currentPage.nodes.push(...line.nodes)
    return line.height
  }

  // Reserve the whole header so it can never straddle a page break.
  b.ensureSpace(nameH + headlineH + contactH + 40 + (spec.header === 'banner' ? 20 : 0))

  switch (spec.header) {
    case 'accent-rule': {
      b.currentPage.nodes.push(b.node('rect', x, b.y, w, 4, { backgroundColor: c.primary }))
      b.advanceY(15)
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('left'), displayName, nameRef))
      b.advanceY(nameH + 4)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('left'), info.headline, headlineRef))
        b.advanceY(headlineH + 8)
      }
      if (contacts.length) b.advanceY(pushContactLine(x, b.y, w, 'left'))
      break
    }
    case 'nameplate': {
      const frameH = nameH + (info.headline ? headlineH + 5 : 0) + 24
      for (const [rx, ry, rw, rh] of [[x, b.y, w, 0.7], [x, b.y + frameH, w, 0.7], [x, b.y, 0.7, frameH], [x + w - 0.7, b.y, 0.7, frameH]]) {
        b.currentPage.nodes.push(b.node('rect', rx, ry, rw, rh, { backgroundColor: c.sectionBorder }))
      }
      b.currentPage.nodes.push(text(x + 18, b.y + 12, nameW, nameH, nameStyle('center'), displayName, nameRef))
      if (info.headline) b.currentPage.nodes.push(text(x + 18, b.y + 12 + nameH + 5, nameW, headlineH, headlineStyle('center'), info.headline, headlineRef))
      b.advanceY(frameH + 10)
      if (contacts.length) b.advanceY(pushContactLine(x, b.y, w, 'center'))
      break
    }
    case 'right-aligned': {
      b.currentPage.nodes.push(b.node('rect', x + w - 38, b.y, 38, 3, { backgroundColor: c.primary }))
      b.advanceY(12)
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('right'), displayName, nameRef))
      b.advanceY(nameH + 5)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('right'), info.headline, headlineRef))
        b.advanceY(headlineH + 10)
      }
      if (contacts.length) b.advanceY(pushContactLine(x, b.y, w, 'right'))
      break
    }
    case 'masthead': {
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('left'), displayName, nameRef))
      b.advanceY(nameH + 4)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('left'), info.headline, headlineRef))
        b.advanceY(headlineH + 10)
      }
      if (contacts.length) {
        const stripH = measureContactHeight(contacts, w - 20, fp.scale.small, 1.55) + 12
        b.currentPage.nodes.push(b.node('rect', x, b.y, w, stripH, { backgroundColor: c.surfaceElevated }))
        pushContactLine(x + 10, b.y + 6, w - 20, 'left')
        b.advanceY(stripH)
      }
      break
    }
    case 'ribbon': {
      if (info.headline) {
        const ribbonW = Math.min(w, Math.max(w * 0.5, avgGlyphWidth(info.headline, fp.scale.headline) * info.headline.length + 24))
        const ribbonH = estimateWrappedTextHeight(info.headline, ribbonW - 20, fp.scale.headline, fp.lineHeight.body)
        b.currentPage.nodes.push(b.node('rect', x, b.y, ribbonW, ribbonH + 10, { backgroundColor: c.surfaceElevated }))
        b.currentPage.nodes.push(text(x + 10, b.y + 5, ribbonW - 20, ribbonH, headlineStyle('left'), info.headline, headlineRef))
        b.advanceY(ribbonH + 20)
      }
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('left'), displayName, nameRef))
      b.advanceY(nameH + 10)
      if (contacts.length) b.advanceY(pushContactLine(x, b.y, w, 'left'))
      break
    }
    case 'seal': {
      const diameter = 38
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('')
      const sealX = x + (w - diameter) / 2
      b.currentPage.nodes.push(b.node('rect', sealX, b.y, diameter, diameter, { backgroundColor: c.surfaceElevated }, { clipShape: 'circle' }))
      b.currentPage.nodes.push(text(sealX, b.y + 10, diameter, 18, { ...nameStyle('center'), fontSize: 15, lineHeight: 1.2, color: c.primary }, initials))
      b.advanceY(diameter + 9)
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('center'), displayName, nameRef))
      b.advanceY(nameH + 4)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('center'), info.headline, headlineRef))
        b.advanceY(headlineH + 8)
      }
      if (contacts.length) b.advanceY(pushContactLine(x, b.y, w, 'center'))
      break
    }
    case 'minimal': {
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('left'), displayName, nameRef))
      b.advanceY(nameH + 5)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('left'), info.headline, headlineRef))
        b.advanceY(headlineH + 8)
      }
      if (contacts.length) b.advanceY(pushContactLine(x, b.y, w, 'left'))
      break
    }
    case 'editorial': {
      if (info.headline) {
        b.currentPage.nodes.push(text(x + 16, b.y, nameW, headlineH, headlineStyle('left'), info.headline, headlineRef))
        b.advanceY(headlineH + 6)
      }
      b.currentPage.nodes.push(b.node('rect', x, b.y + 3, 2, Math.max(1, nameH - 6), { backgroundColor: c.primary }))
      b.currentPage.nodes.push(text(x + 16, b.y, nameW, nameH, nameStyle('left'), displayName, nameRef))
      b.advanceY(nameH + 12)
      if (contacts.length) b.advanceY(pushContactLine(x, b.y, w, 'left') + 10)
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 0.6, { color: c.divider }))
      break
    }

    case 'banner': {
      const padY = 16
      const inset = 18
      const bandH = nameH + (info.headline ? headlineH + 5 : 0) + padY * 2
      b.currentPage.nodes.push(
        b.node('rect', x, b.y, w, bandH, { backgroundColor: c.panelBackground })
      )
      b.currentPage.nodes.push(text(x + inset, b.y + padY, w - inset * 2, nameH,
        { ...nameStyle('left'), color: c.panelText }, displayName, nameRef))
      if (info.headline) {
        b.currentPage.nodes.push(text(x + inset, b.y + padY + nameH + 5, w - inset * 2, headlineH,
          { ...headlineStyle('left'), color: c.panelSecondaryText }, info.headline, headlineRef))
      }
      b.advanceY(bandH + 10)
      if (contacts.length) {
        b.advanceY(pushContactLine(x, b.y, w, 'left'))
      }
      break
    }

    case 'split': {
      // Name column and contact column share a top edge; the taller of the two
      // sets the block height so the rule underneath never clips either.
      const rightW = splitRightW
      const leftW = w - rightW - 24
      b.currentPage.nodes.push(text(x, b.y, leftW, nameH, nameStyle('left'), displayName, nameRef))
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y + nameH + 2, leftW, headlineH, headlineStyle('left'), info.headline, headlineRef))
      }
      let contactY = 0
      contacts.forEach((item) => {
        const h = estimateTextHeight(item.content, rightW, fp.scale.small, 1.55)
        b.currentPage.nodes.push(text(x + leftW + 24, b.y + contactY, rightW, h,
          contactStyle('right'), item.content, { kind: 'personal-info', field: item.field }))
        contactY += h + 1
      })
      const leftH = nameH + (info.headline ? headlineH + 2 : 0)
      b.advanceY(Math.max(leftH, contactY) + 12)
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 0.7, { color: c.divider }))
      break
    }

    case 'centered': {
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('center'), displayName, nameRef))
      b.advanceY(nameH + 6)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('center'), info.headline, headlineRef))
        b.advanceY(headlineH + 10)
      }
      if (contacts.length) {
        b.advanceY(pushContactLine(x, b.y, w, 'center'))
      }
      break
    }

    case 'rule': {
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 0.7, { color: c.divider }))
      b.advanceY(10)
      b.currentPage.nodes.push(text(x, b.y, w, nameH, nameStyle('center'), displayName, nameRef))
      b.advanceY(nameH + 8)
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 0.7, { color: c.divider }))
      b.advanceY(8)
      if (info.headline) {
        b.currentPage.nodes.push(text(x, b.y, w, headlineH, headlineStyle('center'), info.headline, headlineRef))
        b.advanceY(headlineH + 3)
      }
      if (contacts.length) {
        b.advanceY(pushContactLine(x, b.y, w, 'center'))
      }
      break
    }

    case 'monogram': {
      const tile = 50
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
      b.currentPage.nodes.push(b.node('rect', x, b.y, tile, tile, { backgroundColor: c.surfaceElevated }))
      const initialSize = 20
      b.currentPage.nodes.push(text(x, b.y + (tile - initialSize * 1.2) / 2, tile, initialSize * 1.2, {
        fontFamily: fp.headingFamily,
        fontSize: initialSize,
        fontWeight: 600,
        color: c.primary,
        lineHeight: 1.2,
        textAlign: 'center',
      }, initials || 'AM'))
      const textX = x + tile + 18
      const textW = w - tile - 18
      b.currentPage.nodes.push(text(textX, b.y, textW, nameH, nameStyle('left'), displayName, nameRef))
      if (info.headline) {
        b.currentPage.nodes.push(text(textX, b.y + nameH + 1, textW, headlineH, headlineStyle('left'), info.headline, headlineRef))
      }
      b.advanceY(Math.max(tile, nameH + (info.headline ? headlineH + 1 : 0)) + 14)
      if (contacts.length) {
        b.advanceY(pushContactLine(x, b.y, w, 'left'))
      }
      break
    }

    case 'stacked':
    default: {
      const textW = nameW
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
      if (contacts.length) {
        b.advanceY(pushContactLine(x, b.y, textW, 'left') + 9)
      }
      b.currentPage.nodes.push(b.node('divider', x, b.y, w, 0.7, { color: c.divider }))
      break
    }
  }

  b.advanceY(metricsFor(spec, resume).headerGap)
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
  c: ResolvedPalette,
  w: number,
  title: string,
  continued: boolean,
  icon: IconName | undefined,
  editRef: EditRef | undefined,
  ordinal = 1
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
      estimateStyledTextHeight(shown, widthPt, size, fp.lineHeight.heading, tracking, fp.headingFamily, 600),
      estimateWrappedTextHeight(shown, widthPt, size, fp.lineHeight.heading, fp.headingFamily, 600)
    )
  const titleH = measure(w)

  const titleStyle: Partial<LayoutStyles> = {
    fontFamily: fp.headingFamily,
    fontSize: size,
    fontWeight: 600,
    color: c.sectionTitle,
    lineHeight: fp.lineHeight.heading,
    textAlign: 'left',
    letterSpacing: spec.uppercaseSectionTitles ? 0.08 : 0,
  }
  const t = (x: number, y: number, width: number, h: number, s: Partial<LayoutStyles>, content: string) =>
    b.node('text', x, y, width, h, s, { content, editRef })

  switch (spec.sectionHeader) {
    case 'badge': {
      const h = measure(w - 30)
      const diameter = 20
      nodes.push(b.node('rect', 0, 0, diameter, diameter, { backgroundColor: c.primary }, { clipShape: 'circle' }))
      nodes.push(b.node('icon', 5, 5, 10, 10, { color: contrastInk(c.primary) }, { iconName: icon ?? 'user', iconEditable: true }))
      nodes.push(t(28, 3, w - 28, h, titleStyle, shown))
      nodes.push(b.node('divider', 28, Math.max(h + 7, 21), w - 28, 0.6, { color: c.sectionBorder }))
      return { nodes, height: Math.max(h + 17, 29) }
    }
    case 'outline-label': {
      const h = measure(w - 16)
      const height = h + 8
      for (const [rx, ry, rw, rh] of [[0, 0, w, 0.7], [0, height, w, 0.7], [0, 0, 0.7, height], [w - 0.7, 0, 0.7, height]]) {
        nodes.push(b.node('rect', rx, ry, rw, rh, { backgroundColor: c.sectionBorder }))
      }
      nodes.push(t(8, 4, w - 16, h, titleStyle, shown))
      return { nodes, height: height + 10 }
    }
    case 'block-label': {
      const h = measure(w - 18)
      nodes.push(b.node('rect', 0, 0, w, h + 10, { backgroundColor: c.primary }, { clipShape: 'rounded' }))
      nodes.push(t(9, 5, w - 18, h, { ...titleStyle, color: contrastInk(c.primary) }, shown))
      return { nodes, height: h + 20 }
    }
    case 'editorial-rule': {
      nodes.push(t(0, 0, w, titleH, { ...titleStyle, fontWeight: fp.headingFamily === 'IBMPlexSans' ? 600 : 700 }, shown))
      nodes.push(b.node('rect', 0, titleH + 5, w, 0.7, { backgroundColor: c.sectionBorder }))
      return { nodes, height: titleH + 14 }
    }
    case 'split-rule': {
      const labelW = Math.min(w * 0.7, (measureTextWidth(shown, size, fp.headingFamily, 600, tracking) ?? avgGlyphWidth(shown, size, tracking) * shown.length) + 16)
      const h = measure(labelW)
      const sideW = (w - labelW) / 2
      nodes.push(b.node('divider', 0, h / 2, Math.max(0, sideW - 8), 0.6, { color: c.sectionBorder }))
      nodes.push(t(sideW, 0, labelW, h, { ...titleStyle, textAlign: 'center' }, shown))
      nodes.push(b.node('divider', sideW + labelW + 8, h / 2, Math.max(0, sideW - 8), 0.6, { color: c.sectionBorder }))
      return { nodes, height: h + 9 }
    }
    case 'tab': {
      const tabW = Math.min(w, (measureTextWidth(shown, size, fp.headingFamily, 600, tracking) ?? avgGlyphWidth(shown, size, tracking) * shown.length) + 24)
      const h = measure(tabW - 18)
      nodes.push(b.node('rect', 0, 0, tabW, h + 8, { backgroundColor: c.sectionBackground }))
      nodes.push(t(9, 4, tabW - 18, h, titleStyle, shown))
      return { nodes, height: h + 16 }
    }
    case 'overline': {
      nodes.push(b.node('divider', 0, 0, w, 0.7, { color: c.sectionBorder }))
      nodes.push(t(0, 7, w, titleH, titleStyle, shown))
      return { nodes, height: titleH + 15 }
    }
    case 'numbered': {
      const inset = 28
      const h = measure(w - inset)
      nodes.push(b.node('text', 0, 0, 22, titleH, { ...titleStyle, color: c.textMuted, letterSpacing: 0 }, { content: String(ordinal).padStart(2, '0') }))
      nodes.push(t(inset, 0, w - inset, h, titleStyle, shown))
      nodes.push(b.node('divider', 0, h + 5, w, 0.6, { color: c.sectionBorder }))
      return { nodes, height: h + 13 }
    }
    case 'bracket': {
      const h = measure(w - 14)
      nodes.push(b.node('rect', 0, 0, 1, h, { backgroundColor: c.sectionBorder }))
      nodes.push(b.node('rect', 0, h - 1, 7, 1, { backgroundColor: c.sectionBorder }))
      nodes.push(t(14, 0, w - 14, h, titleStyle, shown))
      return { nodes, height: h + 9 }
    }
    case 'caps-rule': {
      // Rule starts after the words rather than under them, so the title reads
      // as a label on a line instead of an underlined heading. The text column
      // is wide enough that ordinary titles never wrap; if one does, the
      // measured height below keeps the rule and the entries clear of it.
      // Sized from the same glyph metric the measurement uses, so an ordinary
      // title occupies one line and the rule starts right after the words.
      const textW = Math.min(w * 0.72, (measureTextWidth(shown, size, fp.headingFamily, 600, tracking) ?? avgGlyphWidth(shown, size, tracking) * shown.length) + 2)
      const h = measure(textW)
      const lineH = size * fp.lineHeight.heading
      nodes.push(t(0, 0, textW, h, { ...titleStyle, color: c.sectionTitle }, shown))
      nodes.push(b.node('divider', textW + 8, lineH / 2, Math.max(0, w - textW - 8), 0.6, { color: c.sectionBorder }))
      return { nodes, height: h + 8 }
    }

    case 'bar': {
      const barH = 3
      nodes.push(b.node('rect', 0, 0, 26, barH, { backgroundColor: c.sectionBorder }))
      nodes.push(t(0, barH + 7, w, titleH, titleStyle, shown))
      return { nodes, height: barH + 7 + titleH + 8 }
    }

    case 'boxed': {
      const padX = 10
      const padY = 4
      const boxedH = measure(w - padX * 2)
      const bandH = boxedH + padY * 2
      nodes.push(b.node('rect', 0, 0, w, bandH, { backgroundColor: c.sectionBackground }))
      nodes.push(t(padX, padY, w - padX * 2, boxedH, { ...titleStyle, color: c.sectionTitle }, shown))
      return { nodes, height: bandH + 8 }
    }

    case 'icon': {
      const iconSize = size * fp.lineHeight.heading * 0.9
      const iconH = measure(w - iconSize - 8)
      nodes.push(b.node('icon', 0, (size * fp.lineHeight.heading - iconSize) / 2, iconSize, iconSize, { color: c.sectionIcon },
        { iconName: icon ?? 'user', iconEditable: true }))
      nodes.push(t(iconSize + 8, 0, w - iconSize - 8, iconH, titleStyle, shown))
      nodes.push(b.node('divider', 0, iconH + 5, w, 1, { color: c.sectionBorder }))
      return { nodes, height: iconH + 5 + 10 }
    }

    case 'side-label': {
      const tick = 2
      const sideH = measure(w - tick - 9)
      nodes.push(b.node('rect', 0, 2, tick, sideH - 4, { backgroundColor: c.sectionBorder }))
      nodes.push(t(tick + 9, 0, w - tick - 9, sideH, titleStyle, shown))
      return { nodes, height: sideH + 8 }
    }

    case 'plain':
      nodes.push(t(0, 0, w, titleH, titleStyle, shown))
      return { nodes, height: titleH + 8 }

    case 'underline':
    default:
      nodes.push(t(0, 0, w, titleH, titleStyle, shown))
      nodes.push(b.node('divider', 0, titleH + 6, w, 0.6, { color: c.sectionBorder }))
      return { nodes, height: titleH + 16 }
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
  c: ResolvedPalette,
  forceBlack: boolean,
  column?: { x: number; w: number }
): void {
  const fullW = column?.w ?? b.contentW
  const railW = spec.body === 'index-rail' ? Math.min(100, fullW * 0.21) : 0
  const w = fullW - railW
  const x = column?.x ?? b.x
  const m = metricsFor(spec, resume)
  const defaultTitle = spec.titles?.[sectionType] ?? DEFAULT_TITLES[sectionType]
  const title = sectionType === 'custom'
    ? defaultTitle
    : resume.sectionTitles?.[sectionType] ?? defaultTitle

  const bodyFor: Partial<LayoutStyles> = {
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.body,
    fontWeight: 400,
    color: c.textPrimary,
    lineHeight: fp.lineHeight.body,
    textAlign: 'left',
  }

  const headerFor = (headerTitle: string, customId?: string) => (continued: boolean) =>
    buildSectionHeader(b, spec, fp, c, railW ? railW - 18 : w, headerTitle, continued,
      spec.sectionHeader === 'icon' || spec.sectionHeader === 'badge'
        ? resolveSectionIcon(resume, sectionType, template.sectionIcons?.[sectionType] ?? 'user', customId)
        : undefined,
      continued
        ? undefined
        : customId
          ? { kind: 'custom-section-title', sectionId: customId, defaultValue: headerTitle }
          : sectionType === 'custom'
            ? undefined
          : { kind: 'section-title', sectionType, defaultValue: defaultTitle },
      resume.sectionOrder.indexOf(sectionType) + 1)

  const place = (entries: EntryResult[], gap: number, headerTitle = title, customId?: string) => {
    if (!entries.length) return
    const header = headerFor(headerTitle, customId)
    if (railW) {
      // Section labels occupy their own horizontal rail, beside the entries.
      // Reserve the tallest label for continuations and one-line entries too.
      const minH = Math.max(header(false).height, header(true).height)
      placeEntryBlock(b, sectionType, x, fullW,
        entries.map(entry => ({ ...entry, height: Math.max(entry.height, minH) })), gap,
        continued => ({ ...header(continued), height: 0 }), bodyFor, railW)
    } else {
      placeEntryBlock(b, sectionType, x, w, entries, gap, header, bodyFor)
    }
    b.advanceY(m.sectionGap)
  }

  switch (sectionType) {
    case 'summary': {
      if (!resume.summary.visible || !resume.summary.content) return
      const h = Math.max(
        estimateTextHeight(resume.summary.content, w, fp.scale.body, fp.lineHeight.body, fp.bodyFamily),
        spec.editorial ? estimateWrappedTextHeight(resume.summary.content, w, fp.scale.body, fp.lineHeight.body, fp.bodyFamily) : 0,
      )
      place([{
        nodes: [b.node('text', 0, 0, w, h, { ...bodyFor, color: c.textSecondary },
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
      if (spec.editorial?.skillStyle) {
        place(visible.map(group => buildRatedSkillGroup(b, group, w, c, fp, spec.editorial!.skillStyle!)), 6)
      } else if (spec.skills === 'meter') {
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
  b: LayoutBuilder, resume: Resume, fp: FontPreset, c: ResolvedPalette
): number {
  const info = resume.personalInfo
  const pad = b.margins.left
  const photo = 92
  const hasPhoto = !!(resume.settings.showProfileImage && info.profileImage)
  const textX = hasPhoto ? pad + photo + 22 : pad
  const textW = b.pageW - textX - pad
  const name = (info.fullName || 'Your Name').toUpperCase()
  const nameSize = fp.scale.name * 1.12
  const nameH = estimateStyledTextHeight(name, textW, nameSize, fp.lineHeight.heading, 0.04, fp.headingFamily, 700)
  const roleH = info.headline
    ? estimateStyledTextHeight(info.headline.toUpperCase(), textW, fp.scale.headline, fp.lineHeight.body, 0.12, fp.bodyFamily, 500)
    : 0
  const blockH = nameH + (info.headline ? roleH + 6 : 0)
  const bandH = Math.max(hasPhoto ? 132 : 0, blockH + 40)
  const blockY = (bandH - blockH) / 2

  b.currentPage.nodes.push(b.node('rect', 0, 0, b.pageW, bandH, { backgroundColor: c.panelBackground }))

  const photoX = pad
  const photoY = (bandH - photo) / 2
  if (hasPhoto) {
    b.currentPage.nodes.push(b.node('image', photoX, photoY, photo, photo,
      { backgroundColor: '#ffffff' }, { imageId: info.profileImage, clipShape: 'circle' }))
  }

  b.currentPage.nodes.push(b.node('text', textX, blockY, textW, nameH, {
    fontFamily: fp.headingFamily,
    fontSize: nameSize,
    fontWeight: 700,
    color: c.panelText,
    lineHeight: fp.lineHeight.heading,
    textAlign: 'left',
    letterSpacing: 0.04,
  }, { content: name, editRef: { kind: 'personal-info', field: 'fullName' } }))

  if (info.headline) {
    b.currentPage.nodes.push(b.node('text', textX, blockY + nameH + 6, textW, roleH, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.headline,
      fontWeight: 500,
      color: c.panelSecondaryText,
      lineHeight: fp.lineHeight.body,
      textAlign: 'left',
      letterSpacing: 0.12,
    }, { content: info.headline.toUpperCase(), editRef: { kind: 'personal-info', field: 'headline' } }))
  }

  return bandH
}

// ─── Open columns beneath a full-width masthead ────────────────────────────────

function renderOpenColumns(
  b: LayoutBuilder, spec: TemplateSpec, resume: Resume, template: TemplateDefinition,
  fp: FontPreset, c: ResolvedPalette, forceBlack: boolean
): void {
  const sb = spec.sidebar
  if (!sb) return
  renderHeaderBlock(b, spec, resume, fp, c)
  if (spec.introFullWidth && resume.sectionOrder.includes('summary')) {
    renderSection(b, spec, 'summary', resume, template, fp, c, forceBlack)
  }
  const startY = b.y
  const startPage = b.allPages.length - 1
  const gutter = 26
  const panelW = (b.contentW - gutter) * sb.widthPct
  const mainW = b.contentW - gutter - panelW
  const left = spec.body === 'columns-left'
  const panelX = left ? b.x : b.x + mainW + gutter
  const mainX = left ? b.x + panelW + gutter : b.x
  const panel = b.forkColumn()
  const inset = 14
  b.advanceY(inset)
  panel.advanceY(inset)
  const panelSections = new Set(sb.sections)
  for (const sectionType of resume.sectionOrder.filter(type => type !== 'custom')) {
    if (spec.introFullWidth && sectionType === 'summary') continue
    if (panelSections.has(sectionType)) {
      renderSection(panel, spec, sectionType, resume, template, fp, c, forceBlack,
        { x: panelX + inset, w: panelW - inset * 2 })
    } else {
      renderSection(b, spec, sectionType, resume, template, fp, c, forceBlack,
        { x: mainX, w: mainW })
    }
  }
  b.mergeColumn(panel)
  b.allPages.forEach((page, index) => {
    if (index < startPage) return
    const top = index === startPage ? startY : b.margins.top
    const bottom = b.availableBottom
    page.nodes.unshift(b.node('rect', panelX, top, panelW, Math.max(0, bottom - top), { backgroundColor: c.panelBackground }))
  })
}

// ─── Two-column ───────────────────────────────────────────────────────────────

/** Contact rows for the panel, one line each so a narrow column can hold them. */
function renderPanelContact(
  b: LayoutBuilder, resume: Resume, x: number, w: number, fp: FontPreset, c: ThemeColors
): void {
  const i = resume.personalInfo
  const rows = contactItems(i, ['phone', 'email', 'location', 'website', 'linkedin'])
  for (const row of rows) {
    const h = estimateTextHeight(row.content, w, fp.scale.small, 1.45)
    b.currentPage.nodes.push(b.node('text', x, b.y, w, h, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.small,
      fontWeight: 400,
      color: c.textSecondary,
      lineHeight: 1.45,
      textAlign: 'left',
    }, { content: row.content, editRef: { kind: 'personal-info', field: row.field } }))
    b.advanceY(h + 4)
  }
  b.advanceY(8)
}

/**
 * Panel + main column.
 *
 * Each column owns its page cursor and the finished pages are merged. Long
 * education or skills lists must not push the other column onto the last page.
 */
function renderTwoColumn(
  b: LayoutBuilder,
  spec: TemplateSpec,
  resume: Resume,
  template: TemplateDefinition,
  fp: FontPreset,
  c: ResolvedPalette,
  forceBlack: boolean
): void {
  const sb = spec.sidebar
  if (!sb) return
  const left = spec.body === 'sidebar-left'
  const panelW = b.pageW * sb.widthPct
  const pad = 24
  const gutter = 28

  const panelX = left ? 0 : b.pageW - panelW
  const colX = panelX + pad
  const colW = panelW - pad * 2
  const mainX = left ? panelW + gutter : b.margins.left
  const mainW = b.pageW - panelW - gutter - (left ? b.margins.right : b.margins.left)

  // Reversed-out panels need their own ink; a tinted one keeps the body colours.
  const panelC: ResolvedPalette = sb.tone === 'dark'
    ? {
        ...c,
        textPrimary: c.panelText,
        textSecondary: c.panelSecondaryText,
        textMuted: c.panelSecondaryText,
        divider: c.panelSecondaryText,
        primary: c.panelText,
        sectionTitle: c.panelText,
        sectionDescription: c.panelSecondaryText,
        sectionBorder: c.panelSecondaryText,
        sectionIcon: c.panelText,
        sectionBackground: c.panelBackground,
      }
    : c

  // The band spans both columns, so it is drawn before either and pushes the
  // shared start line down.
  const bandH = spec.header === 'band-photo' ? renderPhotoBand(b, resume, fp, c) : 0
  const top = bandH ? bandH + 20 : b.margins.top
  b.seekY(top)
  const main = b.forkColumn()

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
    const nameH = estimateWrappedTextHeight(name, colW, fp.scale.name * 0.82, fp.lineHeight.heading, fp.headingFamily, 700)
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
      const hlH = estimateWrappedTextHeight(resume.personalInfo.headline, colW, fp.scale.headline * 0.9, fp.lineHeight.body)
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
  for (const sectionType of resume.sectionOrder.filter((type) => type !== 'custom')) {
    if (panelSections.has(sectionType)) {
      renderSection(b, spec, sectionType, resume, template, fp, panelC, forceBlack, { x: colX, w: colW })
    }
  }
  if (!sb.nameInPanel && !bandH) renderHeaderBlock(main, spec, resume, fp, c, { x: mainX, w: mainW })
  for (const sectionType of resume.sectionOrder.filter((type) => type !== 'custom')) {
    if (!panelSections.has(sectionType)) {
      renderSection(main, spec, sectionType, resume, template, fp, c, forceBlack, { x: mainX, w: mainW })
    }
  }
  b.mergeColumn(main)

  // Painted on every page, behind the content: drawing it only on page one
  // left reversed-out panel text on bare white paper wherever the resume ran
  // past a single page.
  const fill = c.panelBackground
  b.allPages.forEach((page, i) => {
    // Page one starts below the band; later pages have no band to clear.
    const panelTop = i === 0 ? bandH : 0
    page.nodes.unshift(b.node('rect', panelX, panelTop, panelW, b.pageH - panelTop, { backgroundColor: fill }))
  })
}


/**
 * Contact strip across the foot of every page.
 *
 * Height is capped to the bottom margin so it occupies space the text column
 * already leaves empty — the layout needs no other adjustment, and the strip
 * can never collide with content.
 */
function renderFooterContact(
  b: LayoutBuilder, resume: Resume, spec: TemplateSpec, fp: FontPreset, c: ResolvedPalette
): void {
  const i = resume.personalInfo
  const primaryUrl = i.website ? 'website' : 'linkedin'
  const contacts = contactItems(i, ['phone', 'email', primaryUrl, 'location'])
  if (!contacts.length) return

  const barH = Math.min(b.margins.bottom, 34)
  const dark = spec.sidebar?.tone === 'dark' || spec.body === 'single'
  const fill = c.panelBackground
  const ink = dark ? c.panelText : c.textPrimary

  for (const page of b.allPages) {
    const y = page.heightPt - barH + (barH - fp.scale.small * 1.4) / 2
    const contactLine = buildContactLineNodes(
      b,
      contacts,
      b.margins.left,
      y,
      page.widthPt - b.margins.left * 2,
      {
        fontFamily: fp.bodyFamily,
        fontSize: fp.scale.small,
        fontWeight: 500,
        color: ink,
        lineHeight: 1.4,
        textAlign: 'center',
      },
      '     '
    )
    page.nodes.push(
      b.node('rect', 0, page.heightPt - barH, page.widthPt, barH, { backgroundColor: fill }),
      ...contactLine.nodes
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
    const colors = resolvePalette(spec, resume, theme, forceBlack)

    // Same rule as the accent: the template supplies its typeface unless the
    // user has picked a font preset, in which case theirs wins. Derived once
    // and passed everywhere so the shared entry builders match the header.
    const fpx = applyResumeTypography(resolveTemplateTypography(fp, {
      headingFamily: spec.headingFamily,
      bodyFamily: spec.bodyFamily,
      scale: spec.defaultScale,
      lineHeight: spec.defaultLineHeight,
    }), resume.settings)
    const builder = new LayoutBuilder({
      resumeId: resume.id,
      templateId: template.id,
      themeId: theme.id,
      fontPresetId: fp.id,
      pageSize: resume.settings.pageSize,
      marginMm: resume.settings.margins ?? spec.marginMm,
    })

    if (spec.editorial) {
      renderEditorialLayout(builder, spec.editorial, resume, fpx, colors, (column, type, x, w, palette) => {
        renderSection(column, spec, type, resume, template, fpx, palette, forceBlack, { x, w })
      })
    } else if (spec.body === 'sidebar-left' || spec.body === 'sidebar-right') {
      renderTwoColumn(builder, spec, resume, template, fpx, colors, forceBlack)
    } else if (spec.body === 'columns-left' || spec.body === 'columns-right') {
      renderOpenColumns(builder, spec, resume, template, fpx, colors, forceBlack)
    } else {
      renderHeaderBlock(builder, spec, resume, fpx, colors)
      for (const sectionType of resume.sectionOrder.filter((type) => type !== 'custom')) {
        renderSection(builder, spec, sectionType, resume, template, fpx, colors, forceBlack)
      }
    }

    // After the columns, so every page it decorates already exists.
    if (spec.footerContact) renderFooterContact(builder, resume, spec, fpx, colors)

    return builder.build()
  }
}
