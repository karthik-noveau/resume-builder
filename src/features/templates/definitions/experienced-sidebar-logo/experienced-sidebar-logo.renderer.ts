import type { Resume, SectionType, CertificationSection, SkillSection } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutTree, LayoutNode, LayoutNodeType, LayoutStyles, EditRef } from '@/shared/types/layout.types'
import { tintColor } from '@/shared/stores/theme.store'
import { LayoutBuilder } from '../../engine/layout.builder'
import {
  buildExperienceEntry,
  buildEducationEntry,
  buildProjectEntry,
  placeEntryBlock,
  type EntryResult,
  type SectionHeaderResult,
} from '../../engine/section.renderers'
import { estimateTextHeight, estimateStyledTextHeight, displayUrl} from '../../engine/layout.utils'
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
  primary: '#1d4ed8',
  primaryHover: '#1e40af',
  primaryActive: '#1e3a8a',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#eff6ff',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
  accent: '#1d4ed8',
  divider: '#dbeafe',
}

/** Keeps this template's own text/background/divider identity, but lets the
 * selected app theme drive the accent color so theme switching is visible. */
function resolveColors(theme: Theme): ThemeColors {
  return {
    ...COLORS,
    primary: theme.colors.primary,
    primaryHover: theme.colors.primaryHover,
    primaryActive: theme.colors.primaryActive,
    accent: theme.colors.accent,
    divider: tintColor(theme.colors.primary, 0.85),
  }
}

const SIDEBAR_TEXT = '#eff6ff'
const SIDEBAR_TEXT_MUTED = '#bfdbfe'

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
  const colors = resolveColors(theme)
  const builder = new LayoutBuilder({
    resumeId: resume.id,
    templateId: template.id,
    themeId: theme.id,
    fontPresetId: fp.id,
    pageSize: resume.settings.pageSize,
    marginMm: 16,
  })

  const sidebarW = builder.pageW * 0.32
  const pad = 20
  const gutter = 26
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
  const sidebarOrder = resume.sectionOrder.filter((s) => SIDEBAR_TYPES.has(s))
  for (const sectionType of sidebarOrder) {
    renderSidebarSection(builder, sectionType, resume, sidebarContentX, sidebarContentW, fp)
  }
  const sidebarEndY = builder.y

  builder.seekY(startY)
  const afterHeaderY = renderMainHeader(builder, resume, mainX, mainW, fp, startY, colors)
  builder.seekY(afterHeaderY)
  const mainOrder = resume.sectionOrder.filter((s) => !SIDEBAR_TYPES.has(s))
  for (const sectionType of mainOrder) {
    renderMainSection(builder, sectionType, resume, mainX, mainW, fp, colors)
  }
  const mainEndY = builder.y

  // Full-bleed sidebar background on EVERY page, unshifted so it sits behind
  // the content. Drawing it only on page 1 left the sidebar's near-white text
  // on bare white paper wherever the resume ran past one page.
  for (const page of builder.allPages) {
    page.nodes.unshift(t(builder, 'rect', 0, 0, sidebarW, builder.pageH, { color: colors.primary }))
  }

  builder.seekY(Math.max(mainEndY, sidebarEndY))
  return builder.build()
}

function renderMonogram(b: LayoutBuilder, resume: Resume, x: number, w: number, y: number, colors: ThemeColors): number {
  const size = Math.min(w, 72)
  b.currentPage.nodes.push(t(b, 'rect', x, y, size, size, { color: '#ffffff' }))
  b.currentPage.nodes.push(t(b, 'text', x, y + size / 2 - 16, size, 32, {
    fontFamily: 'Manrope',
    fontSize: 24,
    fontWeight: 800,
    color: colors.primary,
    lineHeight: 1,
    textAlign: 'center',
  }, getInitials(resume.personalInfo.fullName)))
  return y + size + 24
}

function renderMainHeader(b: LayoutBuilder, resume: Resume, x: number, w: number, fp: FontPreset, y: number, colors: ThemeColors): number {
  const info = resume.personalInfo
  const nameH = fp.scale.name * fp.lineHeight.heading
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
    const hH = fp.scale.headline * fp.lineHeight.body
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
  const contactText = [info.location, info.phone, info.email, displayUrl(info.website || info.linkedin)]
    .filter(Boolean)
    .join('   ·   ')
  if (contactText) {
    // Measured, not assumed to be one line: the full contact string wraps in
    // the main column's width at most font sizes.
    const cH = estimateTextHeight(contactText, w, fp.scale.small, 1.5)
    b.currentPage.nodes.push(t(b, 'text', x, cy, w, cH, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.small,
      fontWeight: 400,
      color: colors.textSecondary,
      lineHeight: 1.5,
      textAlign: 'left',
    }, contactText))
    cy += cH + 8
  }

  b.currentPage.nodes.push(t(b, 'divider', x, cy, w, 2, { color: colors.primary }))
  return cy + 26
}

function sectionHeader(b: LayoutBuilder, title: string, w: number, fp: FontPreset, continued: boolean, color: string): SectionHeaderResult {
  // Uppercased and letterspaced, so measured with the caps-aware metric — the
  // prose figure reports one line for a title that renders as two, and the
  // first entry then draws on top of it.
  const titleH = Math.max(
    fp.scale.sectionTitle * fp.lineHeight.heading,
    estimateStyledTextHeight((continued ? `${title} (continued)` : title).toUpperCase(), w - 12, fp.scale.sectionTitle, fp.lineHeight.heading, 0.02)
  )
  return {
    nodes: [
      t(b, 'text', 0, 0, w, titleH, {
        fontFamily: fp.headingFamily, fontSize: fp.scale.sectionTitle, fontWeight: 700,
        color, lineHeight: fp.lineHeight.heading, textAlign: 'left', letterSpacing: 0.04,
      }, (continued ? `${title} (continued)` : title).toUpperCase()),
    ],
    height: titleH + 14,
  }
}

function renderMainSection(b: LayoutBuilder, sectionType: SectionType, resume: Resume, x: number, w: number, fp: FontPreset, colors: ThemeColors): void {
  const title = TITLES[sectionType]
  const header = (continued: boolean) => sectionHeader(b, title, w, fp, continued, colors.primary)
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
      b.advanceY(26)
      break
    }
    case 'experience': {
      const visible = resume.experience.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'experience', x, w, visible.map((e) => buildExperienceEntry(b, e, w, colors, fp, false)), 20, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'education': {
      const visible = resume.education.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'education', x, w, visible.map((e) => buildEducationEntry(b, e, w, colors, fp, false)), 16, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'projects': {
      const visible = resume.projects.filter((p) => p.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'projects', x, w, visible.map((p) => buildProjectEntry(b, p, w, colors, fp, false)), 20, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'skills':
    case 'certifications':
    case 'custom':
      break
  }
}

function buildSidebarSkillLine(b: LayoutBuilder, section: SkillSection, w: number): EntryResult {
  const text = section.skills.map((s) => s.name).join(', ')
  const h = estimateTextHeight(text, w, 9, 1.4)
  return {
    nodes: [t(b, 'text', 0, 0, w, h, {
      fontFamily: 'Inter', fontSize: 9, fontWeight: 400, color: SIDEBAR_TEXT, lineHeight: 1.4, textAlign: 'left',
    }, text)],
    height: h,
  }
}

function buildSidebarCert(b: LayoutBuilder, cert: CertificationSection, w: number): EntryResult {
  const titleH = estimateTextHeight(cert.title, w, 9.5, 1.3)
  const nodes: LayoutNode[] = [
    t(b, 'text', 0, 0, w, titleH, { fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, color: SIDEBAR_TEXT, lineHeight: 1.3, textAlign: 'left' }, cert.title),
  ]
  let iy = titleH + 2
  if (cert.issuer) {
    const issuerH = 11
    nodes.push(t(b, 'text', 0, iy, w, issuerH, { fontFamily: 'Inter', fontSize: 8.5, fontWeight: 400, color: SIDEBAR_TEXT_MUTED, lineHeight: 1.2, textAlign: 'left' }, cert.issuer))
    iy += issuerH
  }
  return { nodes, height: iy + 6 }
}

function buildSidebarCustomItem(b: LayoutBuilder, title: string, subtitle: string, w: number): EntryResult {
  const label = subtitle ? `${title}: ${subtitle}` : title
  const h = estimateTextHeight(label, w, 9.5, 1.3)
  return {
    nodes: [t(b, 'text', 0, 0, w, h, { fontFamily: 'Inter', fontSize: 9.5, fontWeight: 400, color: SIDEBAR_TEXT, lineHeight: 1.3, textAlign: 'left' }, label)],
    height: h + 4,
  }
}

function renderSidebarSection(b: LayoutBuilder, sectionType: SectionType, resume: Resume, x: number, w: number, fp: FontPreset): void {
  const bodyStyleFor: Partial<LayoutStyles> = {
    fontFamily: 'Inter', fontSize: 9.5, fontWeight: 400, color: SIDEBAR_TEXT, lineHeight: 1.4, textAlign: 'left',
  }

  switch (sectionType) {
    case 'skills': {
      const visible = resume.skills.filter((s) => s.visible)
      if (!visible.length) return
      const header = (continued: boolean) => sectionHeader(b, TITLES.skills, w, fp, continued, '#ffffff')
      placeEntryBlock(b, 'skills', x, w, visible.map((s) => buildSidebarSkillLine(b, s, w)), 10, header, bodyStyleFor)
      b.advanceY(22)
      break
    }
    case 'certifications': {
      const visible = resume.certifications.filter((c) => c.visible)
      if (!visible.length) return
      const header = (continued: boolean) => sectionHeader(b, TITLES.certifications, w, fp, continued, '#ffffff')
      placeEntryBlock(b, 'certifications', x, w, visible.map((c) => buildSidebarCert(b, c, w)), 8, header, bodyStyleFor)
      b.advanceY(22)
      break
    }
    case 'custom': {
      for (const cs of resume.customSections.filter((s) => s.visible && s.items.length > 0)) {
        const header = (continued: boolean) => sectionHeader(b, cs.title, w, fp, continued, '#ffffff')
        placeEntryBlock(b, 'custom', x, w, cs.items.map((i) => buildSidebarCustomItem(b, i.title, i.subtitle, w)), 4, header, bodyStyleFor)
        b.advanceY(22)
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
