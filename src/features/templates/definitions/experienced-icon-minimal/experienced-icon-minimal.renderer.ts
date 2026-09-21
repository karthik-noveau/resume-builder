import type { Resume, SectionType } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutTree, LayoutNode, LayoutNodeType, LayoutStyles, IconName, EditRef } from '@/shared/types/layout.types'
import { tintColor, CUSTOM_THEME_ID } from '@/shared/stores/theme.store'
import { getTemplateColorConfiguration, resolveTemplateColors, type TemplateColorValues } from '@/shared/utils/templateColors'
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
import { applyResumeTypography, estimateTextHeight, estimateStyledTextHeight, captionStyle, resolveTemplateTypography, resumeSpacingMultiplier } from '../../engine/layout.utils'
import { buildContactLineNodes, contactItems } from '../../engine/contact.layout'
import { resolveSectionIcon } from '../../engine/icons'
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
>

function resolveColors(theme: Theme, resume: Resume): ResolvedColors {
  const defaults = getTemplateColorConfiguration('experienced-icon-minimal').defaults
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
    sectionTitle: selected.sectionTitle,
    sectionDescription: selected.sectionDescription,
    sectionBorder: selected.sectionBorder,
    sectionIcon: selected.sectionIcon,
    sectionBackground: selected.sectionBackground,
  }
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
  const colors = resolveColors(theme, resume)
  const fpx = applyResumeTypography(resolveTemplateTypography(fp, {
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    scale: { name: 32, headline: 12, sectionTitle: 10.5, entryTitle: 11, body: 10, small: 9, caption: 8.5 },
    lineHeight: { heading: 1.2, body: 1.45 },
  }), resume.settings)
  const builder = new LayoutBuilder({
    resumeId: resume.id,
    templateId: template.id,
    themeId: theme.id,
    fontPresetId: fp.id,
    pageSize: resume.settings.pageSize,
    marginMm: resume.settings.margins ?? 16,
  })

  renderHeader(builder, resume, fpx, colors)

  const w = builder.contentW
  const x = builder.x

  for (const sectionType of resume.sectionOrder) {
    if (sectionType === 'custom') continue
    renderSection(builder, sectionType, resume, template, x, w, fpx, forceBlack, colors)
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

  const nameH = estimateStyledTextHeight(info.fullName || 'Your Name', textW, fp.scale.name, fp.lineHeight.heading, 0, fp.headingFamily, 700)
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
    const hH = estimateTextHeight(info.headline, textW, fp.scale.headline, fp.lineHeight.body, fp.bodyFamily, 500)
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

  const primaryUrl = info.website ? 'website' : 'linkedin'
  const contacts = contactItems(info, ['location', 'phone', 'email', primaryUrl])
  if (contacts.length) {
    const line = buildContactLineNodes(b, contacts, b.x, b.y, w, {
      ...captionStyle(colors, fp),
      color: colors.textSecondary,
    })
    b.currentPage.nodes.push(...line.nodes)
    b.advanceY(line.height + 12)
  }

  b.currentPage.nodes.push(t(b, 'divider', b.x, b.y, w, 0.7, { color: colors.divider }))
  b.advanceY(16)
}

function iconHeader(
  b: LayoutBuilder,
  title: string,
  w: number,
  fp: FontPreset,
  continued: boolean,
  colors: ResolvedColors,
  icon: IconName,
  editRef?: EditRef
): SectionHeaderResult {
  const label = continued ? `${title} (continued)` : title
  const iconSize = fp.scale.sectionTitle * fp.lineHeight.heading * 0.85
  const titleH = estimateStyledTextHeight(label, w - iconSize - 8, fp.scale.sectionTitle, fp.lineHeight.heading, 0, fp.headingFamily, 700)
  const nodes: LayoutNode[] = [
    b.node('icon', 0, (titleH - iconSize) / 2, iconSize, iconSize, { color: colors.sectionIcon }, {
      iconName: icon,
      iconEditable: true,
    }),
    t(b, 'text', iconSize + 8, 0, w - iconSize - 8, titleH, {
      fontFamily: fp.headingFamily,
      fontSize: fp.scale.sectionTitle,
      fontWeight: 700,
      color: colors.sectionTitle,
      lineHeight: fp.lineHeight.heading,
      textAlign: 'left',
    }, label, continued ? undefined : editRef),
  ]
  const dividerY = titleH + 6
  nodes.push(t(b, 'divider', 0, dividerY, w, 0.6, { color: colors.sectionBorder }))
  return { nodes, height: dividerY + 6 }
}

function renderSection(
  b: LayoutBuilder,
  sectionType: SectionType,
  resume: Resume,
  template: TemplateDefinition,
  x: number,
  w: number,
  fp: FontPreset,
  forceBlack: boolean,
  colors: ResolvedColors
): void {
  const spacing = resumeSpacingMultiplier(resume.settings)
  const defaultTitle = TITLES[sectionType]
  const title = sectionType === 'custom'
    ? defaultTitle
    : resume.sectionTitles?.[sectionType] ?? defaultTitle
  const defaultIcon = template.sectionIcons?.[sectionType] ?? 'user'
  const icon = resolveSectionIcon(resume, sectionType, defaultIcon)
  const header = (continued: boolean) => iconHeader(
    b, title, w, fp, continued, colors, icon,
    sectionType === 'custom' ? undefined : { kind: 'section-title', sectionType, defaultValue: defaultTitle },
  )
  const bodyStyleFor: Partial<LayoutStyles> = {
    ...BODY_STYLE,
    color: colors.textPrimary,
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.body,
    lineHeight: fp.lineHeight.body,
  }

  switch (sectionType) {
    case 'summary': {
      if (!resume.summary.visible || !resume.summary.content) return
      const h = estimateTextHeight(resume.summary.content, w, fp.scale.body, fp.lineHeight.body)
      const entries: EntryResult[] = [{
        nodes: [t(b, 'text', 0, 0, w, h, { ...bodyStyleFor, color: colors.textSecondary }, resume.summary.content, { kind: 'summary' })],
        height: h,
      }]
      placeEntryBlock(b, 'summary', x, w, entries, 0, header, bodyStyleFor)
      b.advanceY(16 * spacing)
      break
    }
    case 'experience': {
      const visible = resume.experience.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'experience', x, w, visible.map((e) => buildExperienceEntry(b, e, w, colors, fp, forceBlack)), 16 * spacing, header, bodyStyleFor)
      b.advanceY(16 * spacing)
      break
    }
    case 'education': {
      const visible = resume.education.filter((e) => e.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'education', x, w, visible.map((e) => buildEducationEntry(b, e, w, colors, fp, forceBlack)), 16 * spacing, header, bodyStyleFor)
      b.advanceY(16 * spacing)
      break
    }
    case 'skills': {
      const visible = resume.skills.filter((s) => s.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'skills', x, w, visible.map((s) => buildSkillPills(b, s, w, colors, fp, forceBlack)), 10 * spacing, header, bodyStyleFor)
      b.advanceY(16 * spacing)
      break
    }
    case 'projects': {
      const visible = resume.projects.filter((p) => p.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'projects', x, w, visible.map((p) => buildProjectEntry(b, p, w, colors, fp, forceBlack)), 20 * spacing, header, bodyStyleFor)
      b.advanceY(16 * spacing)
      break
    }
    case 'certifications': {
      const visible = resume.certifications.filter((c) => c.visible)
      if (!visible.length) return
      placeEntryBlock(b, 'certifications', x, w, visible.map((c) => buildCertEntry(b, c, w, colors, fp, forceBlack)), 12 * spacing, header, bodyStyleFor)
      b.advanceY(16 * spacing)
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
        const customIcon = resolveSectionIcon(resume, 'custom', defaultIcon, cs.id)
        placeEntryBlock(b, 'custom', x, w, entries, 0, (continued) => iconHeader(
          b, cs.title, w, fp, continued, colors, customIcon,
          { kind: 'custom-section-title', sectionId: cs.id, defaultValue: cs.title },
        ), bodyStyleFor)
      b.advanceY(16 * spacing)
      }
      break
    }
  }
}

registerRenderer('experienced-icon-minimal', render)
