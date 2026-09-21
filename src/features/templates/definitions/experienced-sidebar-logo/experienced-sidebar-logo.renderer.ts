import type { Resume, SectionType, CertificationSection, SkillSection } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutTree, LayoutNode, LayoutNodeType, LayoutStyles, EditRef } from '@/shared/types/layout.types'
import { tintColor, CUSTOM_THEME_ID } from '@/shared/stores/theme.store'
import { getTemplateColorConfiguration, resolveTemplateColors, type TemplateColorValues } from '@/shared/utils/templateColors'
import { LayoutBuilder } from '../../engine/layout.builder'
import {
  buildExperienceEntry,
  buildEducationEntry,
  buildProjectEntry,
  placeEntryBlock,
  type EntryResult,
  type SectionHeaderResult,
} from '../../engine/section.renderers'
import { applyResumeTypography, estimateTextHeight, estimateStyledTextHeight, resolveTemplateTypography, resumeSpacingMultiplier } from '../../engine/layout.utils'
import { buildContactLineNodes, contactItems, measureContactHeight } from '../../engine/contact.layout'
import { registerRenderer } from '../../engine/template.renderer'

function t(
  b: LayoutBuilder,
  type: LayoutNodeType,
  x: number,
  y: number,
  w: number,
  h: number,
  styles: Partial<LayoutStyles>,
  content?: string,
  editRef?: EditRef
): LayoutNode {
  return b.node(type, x, y, w, h, styles, { content, editRef })
}

const COLORS: ThemeColors = {
  primary: '#0061c4',
  primaryHover: '#0054aa',
  primaryActive: '#00478f',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#eff6ff',
  textPrimary: '#111827',
  textSecondary: '#334155',
  textMuted: '#475569',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0061c4',
  accent: '#0061c4',
  divider: '#cbd5e1',
}

/** Keeps this template's own text/background/divider identity, but lets the
 * selected app theme drive the accent color so theme switching is visible. */
type ResolvedColors = ThemeColors & Pick<TemplateColorValues,
  'sectionTitle' | 'sectionDescription' | 'sectionBorder' | 'sectionIcon' | 'sectionBackground'
> & {
  panelBackground: string
  panelText: string
  panelSecondaryText: string
}

function resolveColors(theme: Theme, resume: Resume): ResolvedColors {
  const defaults = getTemplateColorConfiguration('experienced-sidebar-logo').defaults
  const selected = resolveTemplateColors(resume, {
    ...defaults,
    accent: theme.id === CUSTOM_THEME_ID ? theme.colors.primary : defaults.accent,
  })
  return {
    ...COLORS,
    primary: selected.accent,
    primaryHover: tintColor(selected.accent, -0.15),
    primaryActive: tintColor(selected.accent, -0.3),
    accent: selected.accent,
    divider: selected.divider,
    surfaceElevated: selected.softBackground,
    textPrimary: selected.primaryText,
    textSecondary: selected.sectionDescription,
    textMuted: selected.mutedText,
    panelBackground: selected.panelBackground,
    panelText: selected.panelText,
    panelSecondaryText: selected.panelSecondaryText,
    sectionTitle: selected.sectionTitle,
    sectionDescription: selected.sectionDescription,
    sectionBorder: selected.sectionBorder,
    sectionIcon: selected.sectionIcon,
    sectionBackground: selected.sectionBackground,
  }
}

const SIDEBAR_TYPES = new Set<SectionType>(['skills', 'certifications', 'custom'])

const TITLES: Record<SectionType, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certificates',
  custom: 'Additional',
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'YN'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'YN'
}

function render(resume: Resume, template: TemplateDefinition, theme: Theme, fp: FontPreset): LayoutTree {
  const colors = resolveColors(theme, resume)
  const fpx = applyResumeTypography(resolveTemplateTypography(fp, {
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    scale: { name: 32, headline: 11.5, sectionTitle: 10, entryTitle: 11, body: 9.5, small: 8.5, caption: 8 },
    lineHeight: { heading: 1.2, body: 1.5 },
  }), resume.settings)
  const builder = new LayoutBuilder({
    resumeId: resume.id,
    templateId: template.id,
    themeId: theme.id,
    fontPresetId: fp.id,
    pageSize: resume.settings.pageSize,
    marginMm: resume.settings.margins ?? 16,
  })

  const sidebarW = builder.pageW * 0.29
  const pad = 24
  const gutter = 28
  const mainX = sidebarW + gutter
  const mainW = builder.pageW - mainX - builder.margins.right
  const sidebarContentX = pad
  const sidebarContentW = sidebarW - pad * 2

  const startY = builder.margins.top
  const afterMonogramY = renderMonogram(builder, resume, sidebarContentX, sidebarContentW, startY, colors)

  // The sidebar column is rendered BEFORE the main column, and must stay that
  // way. LayoutBuilder.currentPage is always the *last* page and there is no
  // API to move back to an earlier one, so whichever column runs second lands
  // entirely on the final page once the first one paginates. The sidebar is
  // the shorter column, so the main column is the one allowed to overflow.
  builder.seekY(afterMonogramY)
  const sidebarOrder = resume.sectionOrder.filter((s) => s !== 'custom' && SIDEBAR_TYPES.has(s))
  for (const sectionType of sidebarOrder) {
    renderSidebarSection(builder, sectionType, resume, sidebarContentX, sidebarContentW, fpx, colors)
  }
  const sidebarEndY = builder.y

  builder.seekY(startY)
  const afterHeaderY = renderMainHeader(builder, resume, mainX, mainW, fpx, startY, colors)
  builder.seekY(afterHeaderY)
  const mainOrder = resume.sectionOrder.filter((s) => s !== 'custom' && !SIDEBAR_TYPES.has(s))
  for (const sectionType of mainOrder) {
    renderMainSection(builder, sectionType, resume, mainX, mainW, fpx, colors)
  }
  const mainEndY = builder.y

  // Full-bleed sidebar background on EVERY page, unshifted so it sits behind
  // the content. Drawing it only on page 1 left the sidebar's near-white text
  // on bare white paper wherever the resume ran past one page.
  for (const page of builder.allPages) {
    page.nodes.unshift(t(builder, 'rect', 0, 0, sidebarW, builder.pageH, { color: colors.panelBackground }))
  }

  builder.seekY(Math.max(mainEndY, sidebarEndY))
  return builder.build()
}

function renderMonogram(b: LayoutBuilder, resume: Resume, x: number, w: number, y: number, colors: ResolvedColors): number {
  const size = Math.min(w, 64)
  b.currentPage.nodes.push(t(b, 'rect', x, y, size, size, { color: colors.panelText }))
  b.currentPage.nodes.push(t(b, 'text', x, y + (size - 30) / 2, size, 30, {
    fontFamily: 'SourceSerifPro',
    fontSize: 24,
    fontWeight: 600,
    color: colors.panelBackground,
    lineHeight: 1.25,
    textAlign: 'center',
  }, getInitials(resume.personalInfo.fullName)))
  return y + size + 30
}

function renderMainHeader(b: LayoutBuilder, resume: Resume, x: number, w: number, fp: FontPreset, y: number, colors: ThemeColors): number {
  const info = resume.personalInfo
  const nameH = estimateStyledTextHeight(info.fullName || 'Your Name', w, fp.scale.name, fp.lineHeight.heading, 0, fp.headingFamily, 700)
  b.currentPage.nodes.push(t(b, 'text', x, y, w, nameH, {
    fontFamily: fp.headingFamily,
    fontSize: fp.scale.name,
    fontWeight: 700,
    color: colors.textPrimary,
    lineHeight: fp.lineHeight.heading,
    textAlign: 'left',
  }, info.fullName || 'Your Name', { kind: 'personal-info', field: 'fullName' }))

  let cy = y + nameH + 4
  if (info.headline) {
    const hH = estimateTextHeight(info.headline, w, fp.scale.headline, fp.lineHeight.body, fp.bodyFamily, 500)
    b.currentPage.nodes.push(t(b, 'text', x, cy, w, hH, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.headline,
      fontWeight: 500,
      color: colors.primary,
      lineHeight: fp.lineHeight.body,
      textAlign: 'left',
    }, info.headline, { kind: 'personal-info', field: 'headline' }))
    cy += hH + 10
  }

  // Contact line. Without it the sheet cannot actually be sent to an employer,
  // which is what contact.coverage.test.ts checks for every template.
  const primaryUrl = info.website ? 'website' : 'linkedin'
  const contacts = contactItems(info, ['location', 'phone', 'email', primaryUrl])
  if (contacts.length) {
    // Measured, not assumed to be one line: the full contact string wraps in
    // the main column's width at most font sizes.
    const cH = measureContactHeight(contacts, w, fp.scale.small, 1.5)
    const line = buildContactLineNodes(b, contacts, x, cy, w, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.small,
      fontWeight: 400,
      color: colors.textSecondary,
      lineHeight: 1.5,
      textAlign: 'left',
    })
    b.currentPage.nodes.push(...line.nodes)
    cy += cH + 8
  }

  b.currentPage.nodes.push(t(b, 'divider', x, cy, w, 0.7, { color: colors.divider }))
  return cy + 24
}

function sectionHeader(
  b: LayoutBuilder,
  title: string,
  w: number,
  fp: FontPreset,
  continued: boolean,
  color: string,
  editRef?: EditRef,
): SectionHeaderResult {
  // Uppercased and letterspaced, so measured with the caps-aware metric — the
  // prose figure reports one line for a title that renders as two, and the
  // first entry then draws on top of it.
  const titleH = Math.max(
    fp.scale.sectionTitle * fp.lineHeight.heading,
    estimateStyledTextHeight((continued ? `${title} (continued)` : title).toUpperCase(), w, fp.scale.sectionTitle, fp.lineHeight.heading, 0.04, fp.headingFamily, 700)
  )
  return {
    nodes: [
      t(b, 'text', 0, 0, w, titleH, {
        fontFamily: fp.headingFamily, fontSize: fp.scale.sectionTitle, fontWeight: 700,
        color, lineHeight: fp.lineHeight.heading, textAlign: 'left', letterSpacing: 0.04,
      }, (continued ? `${title} (continued)` : title).toUpperCase(), continued ? undefined : editRef),
    ],
    height: titleH + 12,
  }
}

function renderMainSection(b: LayoutBuilder, sectionType: SectionType, resume: Resume, x: number, w: number, fp: FontPreset, colors: ResolvedColors): void {
  const spacing = resumeSpacingMultiplier(resume.settings)
  const defaultTitle = TITLES[sectionType]
  const title = sectionType === 'custom'
    ? defaultTitle
    : resume.sectionTitles?.[sectionType] ?? defaultTitle
  const header = (continued: boolean) => sectionHeader(
    b, title, w, fp, continued, colors.sectionTitle,
    sectionType === 'custom' ? undefined : { kind: 'section-title', sectionType, defaultValue: defaultTitle },
  )
  const bodyStyleFor: Partial<LayoutStyles> = {
    fontFamily: fp.bodyFamily, fontSize: fp.scale.body, fontWeight: 400,
    color: colors.textPrimary, lineHeight: fp.lineHeight.body, textAlign: 'left',
  }

  switch (sectionType) {
    case 'summary': {
      if (!resume.summary.visible || !resume.summary.content) return
      const h = estimateTextHeight(resume.summary.content, w, fp.scale.body, 1.5)
      const entries: EntryResult[] = [{
        nodes: [t(b, 'text', 0, 0, w, h, { ...bodyStyleFor, lineHeight: 1.5, color: colors.textSecondary }, resume.summary.content, { kind: 'summary' })],
        height: h,
      }]
      placeEntryBlock(b, 'summary', x, w, entries, 0, header, bodyStyleFor)
      b.advanceY(20 * spacing)
      break
    }
    case 'experience': {
      const visible = resume.experience.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'experience', x, w, visible.map((e) => buildExperienceEntry(b, e, w, colors, fp, false)), 20 * spacing, header, bodyStyleFor)
      b.advanceY(20 * spacing)
      break
    }
    case 'education': {
      const visible = resume.education.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'education', x, w, visible.map((e) => buildEducationEntry(b, e, w, colors, fp, false)), 16 * spacing, header, bodyStyleFor)
      b.advanceY(20 * spacing)
      break
    }
    case 'projects': {
      const visible = resume.projects.filter((p) => p.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'projects', x, w, visible.map((p) => buildProjectEntry(b, p, w, colors, fp, false)), 20 * spacing, header, bodyStyleFor)
      b.advanceY(20 * spacing)
      break
    }
    case 'skills':
    case 'certifications':
    case 'custom':
      break
  }
}

function buildSidebarSkillLine(b: LayoutBuilder, section: SkillSection, w: number, colors: ResolvedColors): EntryResult {
  const text = section.skills.map((s) => s.name).join(', ')
  const h = estimateTextHeight(text, w, 9, 1.4)
  return {
    nodes: [t(b, 'text', 0, 0, w, h, {
      fontFamily: 'Inter', fontSize: 9, fontWeight: 400, color: colors.panelText, lineHeight: 1.4, textAlign: 'left',
    }, text)],
    height: h,
  }
}

function buildSidebarCert(b: LayoutBuilder, cert: CertificationSection, w: number, colors: ResolvedColors): EntryResult {
  const titleH = estimateTextHeight(cert.title, w, 9.5, 1.3, 'Inter', 700)
  const nodes: LayoutNode[] = [
    t(b, 'text', 0, 0, w, titleH, { fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, color: colors.panelText, lineHeight: 1.3, textAlign: 'left' }, cert.title),
  ]
  let iy = titleH + 2
  if (cert.issuer) {
    const issuerH = estimateTextHeight(cert.issuer, w, 8.5, 1.4)
    nodes.push(t(b, 'text', 0, iy, w, issuerH, { fontFamily: 'Inter', fontSize: 8.5, fontWeight: 400, color: colors.panelSecondaryText, lineHeight: 1.4, textAlign: 'left' }, cert.issuer))
    iy += issuerH
  }
  return { nodes, height: iy + 6 }
}

function buildSidebarCustomItem(b: LayoutBuilder, title: string, subtitle: string, w: number, colors: ResolvedColors): EntryResult {
  const label = subtitle ? `${title}: ${subtitle}` : title
  const h = estimateTextHeight(label, w, 9.5, 1.3)
  return {
    nodes: [t(b, 'text', 0, 0, w, h, { fontFamily: 'Inter', fontSize: 9.5, fontWeight: 400, color: colors.panelText, lineHeight: 1.3, textAlign: 'left' }, label)],
    height: h + 4,
  }
}

function renderSidebarSection(b: LayoutBuilder, sectionType: SectionType, resume: Resume, x: number, w: number, fp: FontPreset, colors: ResolvedColors): void {
  const spacing = resumeSpacingMultiplier(resume.settings)
  const bodyStyleFor: Partial<LayoutStyles> = {
    fontFamily: 'Inter', fontSize: 9.5, fontWeight: 400, color: colors.panelText, lineHeight: 1.4, textAlign: 'left',
  }

  switch (sectionType) {
    case 'skills': {
      const visible = resume.skills.filter((s) => s.visible)
      if (!visible.length) return
      const title = resume.sectionTitles?.skills ?? TITLES.skills
      const header = (continued: boolean) => sectionHeader(b, title, w, fp, continued, colors.panelText,
        { kind: 'section-title', sectionType: 'skills', defaultValue: TITLES.skills })
      placeEntryBlock(b, 'skills', x, w, visible.map((s) => buildSidebarSkillLine(b, s, w, colors)), 10 * spacing, header, bodyStyleFor)
      b.advanceY(22 * spacing)
      break
    }
    case 'certifications': {
      const visible = resume.certifications.filter((c) => c.visible)
      if (!visible.length) return
      const title = resume.sectionTitles?.certifications ?? TITLES.certifications
      const header = (continued: boolean) => sectionHeader(b, title, w, fp, continued, colors.panelText,
        { kind: 'section-title', sectionType: 'certifications', defaultValue: TITLES.certifications })
      placeEntryBlock(b, 'certifications', x, w, visible.map((c) => buildSidebarCert(b, c, w, colors)), 8 * spacing, header, bodyStyleFor)
      b.advanceY(22 * spacing)
      break
    }
    case 'custom': {
      for (const cs of resume.customSections.filter((s) => s.visible && s.items.length > 0)) {
        const header = (continued: boolean) => sectionHeader(b, cs.title, w, fp, continued, colors.panelText,
          { kind: 'custom-section-title', sectionId: cs.id, defaultValue: cs.title })
        placeEntryBlock(b, 'custom', x, w, cs.items.map((i) => buildSidebarCustomItem(b, i.title, i.subtitle, w, colors)), 4 * spacing, header, bodyStyleFor)
        b.advanceY(22 * spacing)
      }
      break
    }
    case 'summary':
    case 'experience':
    case 'education':
    case 'projects':
      break
  }
}

registerRenderer('experienced-sidebar-logo', render)
