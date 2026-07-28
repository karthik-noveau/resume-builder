import type { Resume, SectionType, SkillSection, CertificationSection } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutTree, LayoutNode, LayoutNodeType, LayoutStyles, IconName, EditRef } from '@/shared/types/layout.types'
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
  primary: '#38bdf8',
  primaryHover: '#0ea5e9',
  primaryActive: '#0284c7',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#f8fafc',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#38bdf8',
  accent: '#38bdf8',
  divider: '#e2e8f0',
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

const SIDEBAR_BG = '#1e293b'
const SIDEBAR_TEXT = '#f1f5f9'
const SIDEBAR_TEXT_MUTED = '#94a3b8'

const SIDEBAR_TYPES = new Set<SectionType>(['skills', 'certifications', 'custom'])

const TITLES: Record<SectionType, string> = {
  summary: 'Profile',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  custom: 'Additional',
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

  const sidebarW = builder.pageW * 0.34
  const pad = 22
  const gutter = 26
  const mainX = sidebarW + gutter
  const mainW = builder.pageW - mainX - builder.margins.right
  const sideX = pad
  const sideW = sidebarW - pad * 2

  const startY = builder.margins.top

  // The sidebar column is rendered BEFORE the main column, and must stay that
  // way. LayoutBuilder.currentPage is always the *last* page and there is no
  // API to move back to an earlier one, so whichever column runs second lands
  // entirely on the final page once the first one paginates. The sidebar is
  // the shorter column, so the main column is the one allowed to overflow.
  const afterHeaderY = renderSidebarHeader(builder, resume, sideX, sideW, fp, startY, colors)
  const afterContactY = renderContactBlock(builder, resume, sideX, sideW, afterHeaderY, colors)

  builder.seekY(afterContactY)
  const sidebarOrder = resume.sectionOrder.filter((s) => SIDEBAR_TYPES.has(s))
  for (const sectionType of sidebarOrder) {
    renderSidebarSection(builder, sectionType, resume, sideX, sideW)
  }
  const sidebarEndY = builder.y

  builder.seekY(startY)
  const mainOrder = resume.sectionOrder.filter((s) => !SIDEBAR_TYPES.has(s))
  for (const sectionType of mainOrder) {
    renderMainSection(builder, sectionType, resume, mainX, mainW, fp, colors)
  }
  const mainEndY = builder.y

  // Full-bleed sidebar background on EVERY page, unshifted so it sits behind
  // the content. Drawing it only on page 1 left the sidebar's near-white text
  // on bare white paper wherever the resume ran past one page.
  for (const page of builder.allPages) {
    page.nodes.unshift(t(builder, 'rect', 0, 0, sidebarW, builder.pageH, { color: SIDEBAR_BG }))
  }

  builder.seekY(Math.max(mainEndY, sidebarEndY))
  return builder.build()
}

function renderSidebarHeader(b: LayoutBuilder, resume: Resume, x: number, w: number, fp: FontPreset, y: number, colors: ThemeColors): number {
  const info = resume.personalInfo
  const hasPhoto = resume.settings.showProfileImage && !!info.profileImage
  const photoSize = Math.min(w, 96)
  let cy = y

  if (hasPhoto && info.profileImage) {
    const photoX = x + (w - photoSize) / 2
    b.currentPage.nodes.push(b.node('image', photoX, cy, photoSize, photoSize, {
      backgroundColor: SIDEBAR_BG,
    }, { imageId: info.profileImage, clipShape: 'circle' }))
    cy += photoSize + 18
  }

  const nameH = fp.scale.name * fp.lineHeight.heading * 0.85
  b.currentPage.nodes.push(t(b, 'text', x, cy, w, nameH, {
    fontFamily: fp.headingFamily,
    fontSize: fp.scale.name * 0.75,
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: fp.lineHeight.heading,
    textAlign: 'center',
  }, info.fullName || 'Your Name', { kind: 'personal-info', field: 'fullName' }))
  cy += nameH + 4

  if (info.headline) {
    const hH = fp.scale.headline * fp.lineHeight.body
    b.currentPage.nodes.push(t(b, 'text', x, cy, w, hH, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.headline * 0.9,
      fontWeight: 500,
      color: colors.primary,
      lineHeight: fp.lineHeight.body,
      textAlign: 'center',
    }, info.headline, { kind: 'personal-info', field: 'headline' }))
    cy += hH + 12
  }

  return cy + 14
}

function contactRow(b: LayoutBuilder, icon: IconName, label: string, w: number, colors: ThemeColors): EntryResult {
  const rowH = 16
  const nodes: LayoutNode[] = [
    b.node('icon', 0, 1, 12, 12, { color: colors.primary }, { iconName: icon }),
    t(b, 'text', 18, 0, w - 18, rowH, {
      fontFamily: 'Inter', fontSize: 9, fontWeight: 400, color: SIDEBAR_TEXT, lineHeight: 1.3, textAlign: 'left',
    }, label),
  ]
  return { nodes, height: rowH + 6 }
}

/**
 * Renders as plain (non-section) nodes rather than via placeEntryBlock —
 * contact details come from Personal Info, not an independently editable
 * section, so this block shouldn't become a clickable canvas "section".
 */
function renderContactBlock(b: LayoutBuilder, resume: Resume, x: number, w: number, y: number, colors: ThemeColors): number {
  const info = resume.personalInfo
  const rows: EntryResult[] = []
  if (info.phone) rows.push(contactRow(b, 'phone', info.phone, w, colors))
  if (info.email) rows.push(contactRow(b, 'mail', info.email, w, colors))
  if (info.location) rows.push(contactRow(b, 'map-pin', info.location, w, colors))
  if (info.website) rows.push(contactRow(b, 'globe', displayUrl(info.website), w, colors))
  if (info.linkedin) rows.push(contactRow(b, 'linkedin', displayUrl(info.linkedin), w, colors))
  if (info.github) rows.push(contactRow(b, 'github', displayUrl(info.github), w, colors))
  if (!rows.length) return y

  const header = sectionHeader(b, 'Contact', w, false, '#ffffff')
  let cy = y
  for (const node of header.nodes) {
    b.currentPage.nodes.push({ ...node, xPt: node.xPt + x, yPt: node.yPt + cy })
  }
  cy += header.height

  for (const row of rows) {
    for (const node of row.nodes) {
      b.currentPage.nodes.push({ ...node, xPt: node.xPt + x, yPt: node.yPt + cy })
    }
    cy += row.height
  }

  return cy + 16
}

function sectionHeader(b: LayoutBuilder, title: string, w: number, continued: boolean, color: string): SectionHeaderResult {
  const titleH = 14
  return {
    nodes: [
      t(b, 'text', 0, 0, w, titleH, {
        fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color, lineHeight: 1.2, textAlign: 'left', letterSpacing: 0.05,
      }, (continued ? `${title} (continued)` : title).toUpperCase()),
    ],
    height: titleH + 12,
  }
}

function renderSidebarSection(b: LayoutBuilder, sectionType: SectionType, resume: Resume, x: number, w: number): void {
  const bodyStyleFor: Partial<LayoutStyles> = {
    fontFamily: 'Inter', fontSize: 9, fontWeight: 400, color: SIDEBAR_TEXT, lineHeight: 1.3, textAlign: 'left',
  }

  switch (sectionType) {
    case 'skills': {
      const visible = resume.skills.filter((s) => s.visible)
      if (!visible.length) return
      const header = (continued: boolean) => sectionHeader(b, TITLES.skills, w, continued, '#ffffff')
      placeEntryBlock(b, 'skills', x, w, visible.map((s) => buildSidebarSkillList(b, s, w)), 10, header, bodyStyleFor)
      b.advanceY(20)
      break
    }
    case 'certifications': {
      const visible = resume.certifications.filter((c) => c.visible)
      if (!visible.length) return
      const header = (continued: boolean) => sectionHeader(b, TITLES.certifications, w, continued, '#ffffff')
      placeEntryBlock(b, 'certifications', x, w, visible.map((c) => buildSidebarCert(b, c, w)), 8, header, bodyStyleFor)
      b.advanceY(20)
      break
    }
    case 'custom': {
      for (const cs of resume.customSections.filter((s) => s.visible && s.items.length > 0)) {
        const header = (continued: boolean) => sectionHeader(b, cs.title, w, continued, '#ffffff')
        placeEntryBlock(b, 'custom', x, w, cs.items.map((i) => buildSidebarListItem(b, i.title, i.subtitle, w)), 4, header, bodyStyleFor)
        b.advanceY(20)
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

/** Compact cert entry for the narrow sidebar column — measures wrapped title height, unlike buildCertEntry. */
function buildSidebarCert(b: LayoutBuilder, cert: CertificationSection, w: number): EntryResult {
  const titleH = estimateTextHeight(cert.title, w, 9.5, 1.3)
  const nodes: LayoutNode[] = [
    t(b, 'text', 0, 0, w, titleH, {
      fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, color: SIDEBAR_TEXT, lineHeight: 1.3, textAlign: 'left',
    }, cert.title),
  ]
  let iy = titleH + 2
  if (cert.issuer) {
    const issuerH = estimateTextHeight(cert.issuer, w, 8.5, 1.2)
    nodes.push(t(b, 'text', 0, iy, w, issuerH, {
      fontFamily: 'Inter', fontSize: 8.5, fontWeight: 400, color: SIDEBAR_TEXT_MUTED, lineHeight: 1.2, textAlign: 'left',
    }, cert.issuer))
    iy += issuerH
  }
  return { nodes, height: iy + 6 }
}

function buildSidebarSkillList(b: LayoutBuilder, section: SkillSection, w: number): EntryResult {
  const text = section.skills.map((s) => s.name).join(', ')
  const h = estimateTextHeight(text, w, 9, 1.35)
  return {
    nodes: [t(b, 'text', 0, 0, w, h, {
      fontFamily: 'Inter', fontSize: 9, fontWeight: 400, color: SIDEBAR_TEXT, lineHeight: 1.35, textAlign: 'left',
    }, text)],
    height: h + 2,
  }
}

function buildSidebarListItem(b: LayoutBuilder, title: string, subtitle: string, w: number): EntryResult {
  const label = subtitle ? `${title}: ${subtitle}` : title
  const h = estimateTextHeight(label, w, 9, 1.3)
  return {
    nodes: [t(b, 'text', 0, 0, w, h, { fontFamily: 'Inter', fontSize: 9, fontWeight: 400, color: SIDEBAR_TEXT, lineHeight: 1.3, textAlign: 'left' }, label)],
    height: h + 4,
  }
}

function mainHeader(b: LayoutBuilder, title: string, w: number, fp: FontPreset, continued: boolean, colors: ThemeColors): SectionHeaderResult {
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
        color: colors.textPrimary, lineHeight: fp.lineHeight.heading, textAlign: 'left', letterSpacing: 0.03,
      }, (continued ? `${title} (continued)` : title).toUpperCase()),
      t(b, 'divider', 0, titleH + 6, w, 2, { color: colors.primary }),
    ],
    height: titleH + 24,
  }
}

function renderMainSection(b: LayoutBuilder, sectionType: SectionType, resume: Resume, x: number, w: number, fp: FontPreset, colors: ThemeColors): void {
  const title = TITLES[sectionType]
  const header = (continued: boolean) => mainHeader(b, title, w, fp, continued, colors)
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
      b.advanceY(24)
      break
    }
    case 'experience': {
      const visible = resume.experience.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'experience', x, w, visible.map((e) => buildExperienceEntry(b, e, w, colors, fp, false)), 20, header, bodyStyleFor)
      b.advanceY(24)
      break
    }
    case 'education': {
      const visible = resume.education.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'education', x, w, visible.map((e) => buildEducationEntry(b, e, w, colors, fp, false)), 16, header, bodyStyleFor)
      b.advanceY(24)
      break
    }
    case 'projects': {
      const visible = resume.projects.filter((p) => p.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'projects', x, w, visible.map((p) => buildProjectEntry(b, p, w, colors, fp, false)), 20, header, bodyStyleFor)
      b.advanceY(24)
      break
    }
    case 'skills':
    case 'certifications':
    case 'custom':
      break
  }
}

registerRenderer('fresher-sidebar-photo', render)
