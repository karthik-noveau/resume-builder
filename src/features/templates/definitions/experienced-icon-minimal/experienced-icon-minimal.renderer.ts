import type { Resume, SectionType } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutTree, LayoutNode, LayoutNodeType, LayoutStyles, IconName, EditRef } from '@/shared/types/layout.types'
import { tintColor } from '@/shared/stores/theme.store'
import { LayoutBuilder } from '../../engine/layout.builder'
import {
  buildExperienceEntry,
  buildEducationEntry,
  buildSkillPills,
  buildProjectEntry,
  buildCertEntry,
  placeEntryBlock,
  type EntryResult,
  type SectionHeaderResult,
} from '../../engine/section.renderers'
import { estimateTextHeight, captionStyle, displayUrl} from '../../engine/layout.utils'
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
  primary: '#1e3a5f',
  primaryHover: '#16324a',
  primaryActive: '#0f2436',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#f8fafc',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
  accent: '#1e3a5f',
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

const SECTION_ICON: Partial<Record<SectionType, IconName>> = {
  summary: 'user',
  experience: 'briefcase',
  education: 'graduation-cap',
  skills: 'sliders',
  projects: 'briefcase',
  certifications: 'award',
  custom: 'message-circle',
}

const TITLES: Record<SectionType, string> = {
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  custom: 'Additional Information',
}

const BODY_STYLE: Partial<LayoutStyles> = {
  fontWeight: 400,
  color: COLORS.textPrimary,
  textAlign: 'left',
}

function render(resume: Resume, template: TemplateDefinition, theme: Theme, fp: FontPreset): LayoutTree {
  const forceBlack = template.exportRules.forceBlackText
  const colors = resolveColors(theme)
  const builder = new LayoutBuilder({
    resumeId: resume.id,
    templateId: template.id,
    themeId: theme.id,
    fontPresetId: fp.id,
    pageSize: resume.settings.pageSize,
    marginMm: 16,
  })

  renderHeader(builder, resume, fp, colors)

  const w = builder.contentW
  const x = builder.x

  for (const sectionType of resume.sectionOrder) {
    renderSection(builder, sectionType, resume, x, w, fp, forceBlack, colors)
  }

  return builder.build()
}

function renderHeader(b: LayoutBuilder, resume: Resume, fp: FontPreset, colors: ThemeColors): void {
  const info = resume.personalInfo
  const w = b.contentW
  const hasPhoto = resume.settings.showProfileImage && !!info.profileImage
  const photoSize = 56
  const textW = hasPhoto ? w - photoSize - 16 : w

  b.ensureSpace(90)

  const nameH = fp.scale.name * fp.lineHeight.heading
  b.currentPage.nodes.push(t(b, 'text', b.x, b.y, textW, nameH, {
    fontFamily: fp.headingFamily,
    fontSize: fp.scale.name,
    fontWeight: 700,
    color: colors.textPrimary,
    lineHeight: fp.lineHeight.heading,
    textAlign: 'left',
  }, info.fullName || 'Your Name', { kind: 'personal-info', field: 'fullName' }))

  if (hasPhoto && info.profileImage) {
    b.currentPage.nodes.push(b.node('image', b.x + textW + 16, b.y, photoSize, photoSize, {
      backgroundColor: colors.surfaceElevated,
    }, { imageId: info.profileImage, clipShape: 'circle' }))
  }

  b.advanceY(nameH + 4)

  if (info.headline) {
    const hH = fp.scale.headline * fp.lineHeight.body
    b.currentPage.nodes.push(t(b, 'text', b.x, b.y, textW, hH, {
      fontFamily: fp.bodyFamily,
      fontSize: fp.scale.headline,
      fontWeight: 500,
      color: colors.primary,
      lineHeight: fp.lineHeight.body,
      textAlign: 'left',
    }, info.headline, { kind: 'personal-info', field: 'headline' }))
    b.advanceY(hH + 8)
  }

  const contactText = [info.location, info.phone, info.email, displayUrl(info.website || info.linkedin)]
    .filter(Boolean)
    .join('   ·   ')
  if (contactText) {
    const cH = fp.scale.small * 1.5
    b.currentPage.nodes.push(t(b, 'text', b.x, b.y, w, cH, {
      ...captionStyle(COLORS, fp),
      color: colors.textSecondary,
    }, contactText))
    b.advanceY(cH + 12)
  }

  b.currentPage.nodes.push(t(b, 'divider', b.x, b.y, w, 1.5, { color: colors.primary }))
  b.advanceY(28)
}

function iconHeader(
  b: LayoutBuilder,
  sectionType: SectionType,
  title: string,
  w: number,
  fp: FontPreset,
  continued: boolean,
  colors: ThemeColors
): SectionHeaderResult {
  const titleH = fp.scale.sectionTitle * fp.lineHeight.heading
  const iconSize = titleH * 0.95
  const nodes: LayoutNode[] = [
    b.node('icon', 0, (titleH - iconSize) / 2, iconSize, iconSize, { color: colors.primary }, {
      iconName: SECTION_ICON[sectionType] ?? 'user',
    }),
    t(b, 'text', iconSize + 8, 0, w - iconSize - 8, titleH, {
      fontFamily: fp.headingFamily,
      fontSize: fp.scale.sectionTitle,
      fontWeight: 700,
      color: colors.textPrimary,
      lineHeight: fp.lineHeight.heading,
      textAlign: 'left',
    }, continued ? `${title} (continued)` : title),
  ]
  const dividerY = titleH + 6
  nodes.push(t(b, 'divider', 0, dividerY, w, 1, { color: colors.divider }))
  return { nodes, height: dividerY + 18 }
}

function renderSection(
  b: LayoutBuilder,
  sectionType: SectionType,
  resume: Resume,
  x: number,
  w: number,
  fp: FontPreset,
  forceBlack: boolean,
  colors: ThemeColors
): void {
  const title = TITLES[sectionType]
  const header = (continued: boolean) => iconHeader(b, sectionType, title, w, fp, continued, colors)
  const bodyStyleFor: Partial<LayoutStyles> = {
    ...BODY_STYLE,
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.body,
    lineHeight: fp.lineHeight.body,
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
      placeEntryBlock(b, 'experience', x, w, visible.map((e) => buildExperienceEntry(b, e, w, COLORS, fp, forceBlack)), 20, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'education': {
      const visible = resume.education.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'education', x, w, visible.map((e) => buildEducationEntry(b, e, w, COLORS, fp, forceBlack)), 16, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'skills': {
      const visible = resume.skills.filter((s) => s.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'skills', x, w, visible.map((s) => buildSkillPills(b, s, w, COLORS, fp, forceBlack)), 10, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'projects': {
      const visible = resume.projects.filter((p) => p.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'projects', x, w, visible.map((p) => buildProjectEntry(b, p, w, COLORS, fp, forceBlack)), 20, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'certifications': {
      const visible = resume.certifications.filter((c) => c.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'certifications', x, w, visible.map((c) => buildCertEntry(b, c, w, COLORS, fp, forceBlack)), 12, header, bodyStyleFor)
      b.advanceY(26)
      break
    }
    case 'custom': {
      for (const cs of resume.customSections.filter((s) => s.visible && s.items.length > 0)) {
        const text = cs.items.map((i) => i.title).join(', ')
        const h = estimateTextHeight(text, w, fp.scale.body, 1.5)
        const entries: EntryResult[] = [{
          nodes: [t(b, 'text', 0, 0, w, h, { ...bodyStyleFor, lineHeight: 1.5 }, text)],
          height: h,
        }]
        placeEntryBlock(b, 'custom', x, w, entries, 0, (continued) => iconHeader(b, 'custom', cs.title, w, fp, continued, colors), bodyStyleFor)
        b.advanceY(26)
      }
      break
    }
  }
}

registerRenderer('experienced-icon-minimal', render)
