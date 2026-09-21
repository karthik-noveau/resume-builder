import type {
  Resume,
  PersonalInfo,
  SectionType,
  ExperienceSection,
  EducationSection,
  Skill,
  SkillSection,
  ProjectSection,
  CertificationSection,
} from '@/shared/types/resume.types'
import type { Theme } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutNode, LayoutNodeType, LayoutStyles, EditRef, EntrySectionType } from '@/shared/types/layout.types'
import type { LayoutBuilder } from './layout.builder'
import {
  estimateTextHeight,
  estimateStyledTextHeight,
  estimateWrappedTextHeight,
  nameStyle,
  sectionTitleStyle,
  entryTitleStyle,
  bodyStyle,
  smallStyle,
  captionStyle,
  metadataStyle,
} from './layout.utils'
import { buildContactLineNodes, contactItems } from './contact.layout'

// ─── Typed helper ─────────────────────────────────────────────────────────────

function tn(
  b: LayoutBuilder,
  type: LayoutNodeType,
  xPt: number,
  yPt: number,
  widthPt: number,
  heightPt: number,
  styles: Partial<LayoutStyles>,
  content?: string,
  editRef?: EditRef
): LayoutNode {
  return b.node(type, xPt, yPt, widthPt, heightPt, styles, { content, editRef })
}

// ─── Render context ───────────────────────────────────────────────────────────

export interface RenderCtx {
  builder: LayoutBuilder
  theme: Theme
  fp: FontPreset
  forceBlack: boolean
  singleColumn: boolean
  colX?: number
  colW?: number
  uppercase?: boolean
}

function getXW(c: RenderCtx): { x: number; w: number } {
  return { x: c.colX ?? c.builder.x, w: c.colW ?? c.builder.contentW }
}

// ─── Header Styles ────────────────────────────────────────────────────────────

/** Centered fallback header, used only by the unregistered-template safety net. */
export function renderHeader(c: RenderCtx, info: PersonalInfo): void {
  const { builder: b, fp, forceBlack, theme } = c
  const colors = theme.colors
  const { x, w } = getXW(c)

  b.ensureSpace(120)
  
  // Center aligned name with wide letter spacing
  const nameH = fp.scale.name * fp.lineHeight.heading
  b.currentPage.nodes.push(tn(b, 'text', x, b.y, w, nameH, {
    ...nameStyle(colors, fp, forceBlack),
    textAlign: 'center',
    fontSize: fp.scale.name * 1.15,
    letterSpacing: 0.05
  }, info.fullName?.toUpperCase() || 'YOUR NAME', { kind: 'personal-info', field: 'fullName' }))
  b.advanceY(nameH + 6)

  if (info.headline) {
    const hH = fp.scale.headline * fp.lineHeight.body
    b.currentPage.nodes.push(tn(b, 'text', x, b.y, w, hH, {
      ...bodyStyle(colors, fp, forceBlack),
      fontSize: fp.scale.headline,
      fontWeight: 500,
      color: colors.primary,
      textAlign: 'center',
      letterSpacing: 0.08
    }, info.headline.toUpperCase(), { kind: 'personal-info', field: 'headline' }))
    b.advanceY(hH + 12)
  }

  const contacts = contactItems(info, ['location', 'phone', 'email', 'website'])
  if (contacts.length) {
    const line = buildContactLineNodes(b, contacts, x, b.y, w, {
      ...captionStyle(colors, fp), 
      textAlign: 'center'
    }, '   •   ')
    b.currentPage.nodes.push(...line.nodes)
    b.advanceY(line.height)
  }
  b.advanceY(35)
}

// ─── Entry builders ───────────────────────────────────────────────────────────

export type EntryResult = { nodes: LayoutNode[]; height: number; entryId?: string }

/** Dates use a separate row in a sidebar, and a real gutter at full width. */
function entryHeading(
  b: LayoutBuilder,
  title: string,
  date: string,
  w: number,
  colors: Theme['colors'],
  fp: FontPreset,
  forceBlack: boolean,
  editRef?: EditRef,
): EntryResult {
  const stacked = w < 250
  const dateW = date && !stacked ? Math.min(126, w * 0.3) : 0
  const titleW = dateW ? w - dateW - 14 : w
  const titleH = estimateStyledTextHeight(title, titleW, fp.scale.entryTitle, fp.lineHeight.heading, 0, fp.headingFamily, 600)
  const dateH = date ? estimateTextHeight(date, stacked ? w : dateW, fp.scale.small, fp.lineHeight.body, fp.bodyFamily) : 0
  const dateY = stacked ? titleH + 4 : Math.max(0, (fp.scale.entryTitle * fp.lineHeight.heading - fp.scale.small * fp.lineHeight.body) * 0.75)
  const nodes = [tn(b, 'text', 0, 0, titleW, titleH, {
    ...entryTitleStyle(colors, fp, forceBlack), fontWeight: 600,
  }, title, editRef)]
  if (date) nodes.push(tn(b, 'text', stacked ? 0 : w - dateW, dateY,
    stacked ? w : dateW, dateH, {
      ...smallStyle(colors, fp), color: forceBlack ? '#000000' : colors.textMuted,
      textAlign: stacked ? 'left' : 'right', fontWeight: 400,
    }, date))
  return { nodes, height: date ? Math.max(titleH, dateY + dateH) : titleH }
}

export function buildExperienceEntry(b: LayoutBuilder, entry: ExperienceSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const endLabel = entry.current ? 'Present' : entry.endDate
  const dateLine = [entry.startDate, endLabel].filter(Boolean).join(' – ')

  const heading = entryHeading(b, entry.role || 'Role', dateLine, w, colors, fp, forceBlack,
    { kind: 'entry-field', sectionType: 'experience', entryId: entry.id, field: 'role' })
  nodes.push(...heading.nodes)
  iy += heading.height + 3

  // Narrow columns use stacked metadata; wider columns keep a real gutter.
  const stackLocation = w < 250
  const locationW = entry.location && !stackLocation ? Math.min(108, w * 0.3) : 0
  const companyW = locationW ? w - locationW - 14 : w
  const companyH = estimateTextHeight(entry.company || 'Company', companyW, fp.scale.body, fp.lineHeight.body, fp.bodyFamily, 600)
  nodes.push(tn(b, 'text', 0, iy, companyW, companyH, {
    ...bodyStyle(colors, fp, forceBlack),
    fontWeight: 600,
    color: colors.textSecondary
  }, entry.company || 'Company', { kind: 'entry-field', sectionType: 'experience', entryId: entry.id, field: 'company' }))

  let metadataH = companyH
  if (entry.location) {
    const locationStyle = { ...metadataStyle(colors, fp), fontStyle: 'normal' as const, textAlign: stackLocation ? 'left' as const : 'right' as const }
    const locationH = estimateTextHeight(entry.location, stackLocation ? w : locationW, locationStyle.fontSize, locationStyle.lineHeight, fp.bodyFamily)
    const locationY = stackLocation ? companyH + 3 : Math.max(0, (fp.scale.body * fp.lineHeight.body - locationStyle.fontSize * locationStyle.lineHeight) * 0.75)
    nodes.push(tn(b, 'text', stackLocation ? 0 : w - locationW, iy + locationY, stackLocation ? w : locationW, locationH, locationStyle,
      entry.location, { kind: 'entry-field', sectionType: 'experience', entryId: entry.id, field: 'location' }))
    metadataH = Math.max(companyH, locationY + locationH)
  }
  iy += metadataH

  const bullets = entry.description.map((text, index) => ({ text, index })).filter(bullet => bullet.text)
  if (bullets.length) iy += 8
  for (const [position, { text: bullet, index }] of bullets.entries()) {
    const bH = estimateTextHeight(bullet, w - 12, fp.scale.body, fp.lineHeight.body, fp.bodyFamily)

    // Accent Bullet
    nodes.push(tn(b, 'text', 0, iy, 8, bH, {
        ...bodyStyle(colors, fp, forceBlack),
        color: colors.primary,
        fontWeight: 400
    }, '•'))

    nodes.push(tn(b, 'text', 12, iy, w - 12, bH, {
        ...bodyStyle(colors, fp, forceBlack),
        lineHeight: fp.lineHeight.body,
        color: colors.textSecondary
    }, bullet, { kind: 'entry-list-item', sectionType: 'experience', entryId: entry.id, field: 'description', index }))
    iy += bH + (position < bullets.length - 1 ? 4 : 0)
  }

  return { nodes, height: iy, entryId: entry.id }
}

export function buildEducationEntry(b: LayoutBuilder, entry: EducationSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const degreeText = [entry.degree, entry.fieldOfStudy ? `in ${entry.fieldOfStudy}` : ''].filter(Boolean).join(' ')
  const dateLine = [entry.startDate, entry.endDate].filter(Boolean).join(' – ')

  const heading = entryHeading(b, degreeText, dateLine, w, colors, fp, forceBlack)
  nodes.push(...heading.nodes)
  iy += heading.height + 4

  const gradeText = entry.grade ? `GPA: ${entry.grade}` : ''
  const inlineGrade = !!gradeText && w >= 250
  const institutionW = inlineGrade ? w - 88 : w
  const instH = estimateTextHeight(entry.institution, institutionW, fp.scale.body, fp.lineHeight.body, fp.bodyFamily)
  nodes.push(tn(b, 'text', 0, iy, institutionW, instH, { ...bodyStyle(colors, fp, forceBlack), color: colors.textSecondary }, entry.institution, { kind: 'entry-field', sectionType: 'education', entryId: entry.id, field: 'institution' }))
  if (inlineGrade) nodes.push(tn(b, 'text', w - 74, iy + (fp.scale.body - fp.scale.small) * fp.lineHeight.body * 0.75, 74, fp.scale.small * fp.lineHeight.body,
    { ...smallStyle(colors, fp), textAlign: 'right' }, gradeText))
  iy += instH
  if (gradeText && !inlineGrade) {
    const gradeH = fp.scale.small * fp.lineHeight.body
    nodes.push(tn(b, 'text', 0, iy + 3, w, gradeH, smallStyle(colors, fp), gradeText))
    iy += gradeH + 3
  }

  return { nodes, height: iy, entryId: entry.id }
}

export function buildSkillPills(b: LayoutBuilder, section: SkillSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const skillsText = section.skills.map(s => s.name).join(' · ')
  if (w >= 300) {
    const labelW = Math.min(110, w * 0.24)
    const textW = w - labelW - 14
    const labelH = estimateStyledTextHeight(section.category, labelW, fp.scale.body, fp.lineHeight.body, 0, fp.bodyFamily, 600)
    const textH = estimateTextHeight(skillsText, textW, fp.scale.body, fp.lineHeight.body, fp.bodyFamily)
    return {
      nodes: [
        tn(b, 'text', 0, 0, labelW, labelH, { ...bodyStyle(colors, fp, forceBlack), fontWeight: 600 }, section.category),
        tn(b, 'text', labelW + 14, 0, textW, textH, { ...bodyStyle(colors, fp, forceBlack), color: colors.textSecondary }, skillsText),
      ],
      height: Math.max(labelH, textH),
    }
  }
  
  const catH = estimateStyledTextHeight(section.category, w, fp.scale.body, fp.lineHeight.body, 0, fp.bodyFamily, 600)
  nodes.push(tn(b, 'text', 0, iy, w, catH, { 
    ...bodyStyle(colors, fp, forceBlack), 
    fontWeight: 600,
    color: colors.textPrimary,
    letterSpacing: 0,
  }, section.category))
  iy += catH + 3
  
  const skillsH = estimateTextHeight(skillsText, w, fp.scale.body, fp.lineHeight.body, fp.bodyFamily)
  nodes.push(tn(b, 'text', 0, iy, w, skillsH, {
      ...bodyStyle(colors, fp, forceBlack),
      color: colors.textSecondary,
      lineHeight: fp.lineHeight.body
  }, skillsText))
  
  return { nodes, height: iy + skillsH }
}

/** Skill name with a horizontal 1-5 rating bar underneath — for sidebar/creative templates. */
export function buildSkillBar(
  b: LayoutBuilder,
  skill: Skill,
  w: number,
  accentColor: string,
  trackColor: string,
  textColor: string,
  fp: FontPreset
): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const nameH = estimateTextHeight(skill.name, w, fp.scale.body, fp.lineHeight.body, fp.bodyFamily, 600)
  nodes.push(tn(b, 'text', 0, iy, w, nameH, {
    fontFamily: fp.bodyFamily,
    fontSize: fp.scale.body,
    fontWeight: 600,
    color: textColor,
    lineHeight: fp.lineHeight.body,
    textAlign: 'left',
  }, skill.name))
  iy += nameH + 4

  const barH = 5
  const ratio = Math.min(5, Math.max(1, skill.level ?? 3)) / 5
  nodes.push(tn(b, 'rect', 0, iy, w, barH, { backgroundColor: trackColor }))
  nodes.push(tn(b, 'rect', 0, iy, w * ratio, barH, { backgroundColor: accentColor }))
  iy += barH + 10

  return { nodes, height: iy }
}

/** Honest graphical ratings: unranked skills stay text-only, never default to
 * an invented proficiency. Compact rows work inside the portrait sidebars. */
export function buildRatedSkillGroup(
  b: LayoutBuilder, group: SkillSection, w: number, colors: Theme['colors'], fp: FontPreset, presentation: 'bars' | 'dots',
): EntryResult {
  const nodes: LayoutNode[] = []
  const labelH = estimateTextHeight(group.category, w, fp.scale.body, fp.lineHeight.body, fp.bodyFamily, 600)
  nodes.push(tn(b, 'text', 0, 0, w, labelH, {
    ...bodyStyle(colors, fp, false), fontWeight: 600,
  }, group.category))
  let y = labelH + 6
  for (const skill of group.skills) {
    const rated = typeof skill.level === 'number' && Number.isFinite(skill.level)
    const labelW = rated ? w * 0.57 : w
    const h = Math.max(estimateTextHeight(skill.name, labelW, fp.scale.small, 1.45, fp.bodyFamily),
      estimateWrappedTextHeight(skill.name, labelW, fp.scale.small, 1.45, fp.bodyFamily))
    nodes.push(tn(b, 'text', 0, y, labelW, h, {
      ...smallStyle(colors, fp), color: colors.textPrimary, lineHeight: 1.45,
    }, skill.name))
    if (rated) {
      const rx = w * 0.64
      const rw = w - rx
      const level = Math.min(5, Math.max(0, skill.level!))
      const centerY = y + fp.scale.small * 1.45 / 2
      if (presentation === 'dots') {
        const d = Math.min(5, rw / 8)
        for (let index = 0; index < 5; index++) nodes.push(b.node('rect', rx + index * (rw - d) / 4, centerY - d / 2, d, d,
          { backgroundColor: index < level ? colors.primary : colors.divider }, { clipShape: 'circle' }))
      } else {
        nodes.push(b.node('rect', rx, centerY - 2, rw, 4, { backgroundColor: colors.divider }, { clipShape: 'rounded' }))
        if (level > 0) nodes.push(b.node('rect', rx, centerY - 2, rw * level / 5, 4, { backgroundColor: colors.primary }, { clipShape: 'rounded' }))
      }
    }
    y += h + 5
  }
  return { nodes, height: group.skills.length ? y - 5 : labelH }
}

export function buildProjectEntry(b: LayoutBuilder, entry: ProjectSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const dateLine = [entry.startDate, entry.endDate].filter(Boolean).join(' – ')
  const heading = entryHeading(b, entry.title, dateLine, w, colors, fp, forceBlack,
    { kind: 'entry-field', sectionType: 'projects', entryId: entry.id, field: 'title' })
  nodes.push(...heading.nodes)
  iy += heading.height + 4

  if (entry.technologies && entry.technologies.length > 0) {
    const tagsText = entry.technologies.join(' · ')
    const tagH = estimateTextHeight(tagsText, w, fp.scale.small, fp.lineHeight.body, fp.bodyFamily)
    nodes.push(tn(b, 'text', 0, iy, w, tagH, {
      ...smallStyle(colors, fp),
      color: colors.textMuted,
      fontWeight: 400,
    }, tagsText))
    iy += tagH + 6
  }
  
  if (entry.description) {
    const descH = estimateTextHeight(entry.description, w, fp.scale.body, fp.lineHeight.body, fp.bodyFamily)
    nodes.push(tn(b, 'text', 0, iy, w, descH, {
        ...bodyStyle(colors, fp, forceBlack),
        color: colors.textSecondary,
        lineHeight: fp.lineHeight.body
    }, entry.description, { kind: 'entry-field', sectionType: 'projects', entryId: entry.id, field: 'description' }))
    iy += descH
  }

  return { nodes, height: iy, entryId: entry.id }
}

export function buildCertEntry(b: LayoutBuilder, entry: CertificationSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0
  const stacked = w < 250
  const dateW = entry.issueDate && !stacked ? Math.min(88, w * 0.25) : 0
  const titleW = dateW ? w - dateW - 14 : w
  const titleH = estimateTextHeight(entry.title, titleW, fp.scale.body, fp.lineHeight.body, fp.bodyFamily, 600)
  nodes.push(tn(b, 'text', 0, iy, titleW, titleH, { ...bodyStyle(colors, fp, forceBlack), fontWeight: 600 }, entry.title, { kind: 'entry-field', sectionType: 'certifications', entryId: entry.id, field: 'title' }))
  let headingH = titleH
  if (entry.issueDate) {
    const dateH = estimateTextHeight(entry.issueDate, stacked ? w : dateW, fp.scale.small, fp.lineHeight.body, fp.bodyFamily)
    const dateY = stacked ? titleH + 3 : (fp.scale.body - fp.scale.small) * fp.lineHeight.body * 0.75
    nodes.push(tn(b, 'text', stacked ? 0 : w - dateW, dateY, stacked ? w : dateW, dateH,
      { ...smallStyle(colors, fp), textAlign: stacked ? 'left' : 'right' }, entry.issueDate,
      { kind: 'entry-field', sectionType: 'certifications', entryId: entry.id, field: 'issueDate' }))
    headingH = Math.max(titleH, dateY + dateH)
  }
  iy += headingH + 3
  const issuerText = `${entry.issuer}${entry.credentialId ? `   |   ${entry.credentialId}` : ''}`
  // Measured with the same line height smallStyle renders at — measuring at a
  // tighter one made the box shorter than the text, so a wrapped issuer ran
  // into whatever followed it.
  const issuerH = estimateTextHeight(issuerText, w, fp.scale.small, fp.lineHeight.body, fp.bodyFamily)
  nodes.push(tn(b, 'text', 0, iy, w, issuerH, { ...smallStyle(colors, fp), color: colors.textSecondary, fontWeight: 400 }, issuerText))
  iy += issuerH
  return { nodes, height: iy, entryId: entry.id }
}

// ─── Section placement ────────────────────────────────────────────────────────

export interface SectionHeaderResult { nodes: LayoutNode[]; height: number }

/**
 * Lays out a list of pre-built entries under a caller-supplied header block,
 * paginating across pages as needed. Shared by the generic single-column
 * dispatcher below and by bespoke per-template renderers that need their own
 * header styling (icon-prefixed, sidebar captions, etc) but the same
 * overflow/continuation behavior.
 */
export function placeEntryBlock(
  b: LayoutBuilder,
  sectionType: SectionType,
  x: number,
  w: number,
  entries: EntryResult[],
  entryGap: number,
  buildHeader: (continued: boolean) => SectionHeaderResult,
  bodyStyleFor: Partial<LayoutStyles>,
  entryInsetPt = 0
): void {
  if (!entries.length) return

  let header = buildHeader(false)
  b.ensureSpace(header.height + entries[0].height)

  let sectionY = b.y
  let children: LayoutNode[] = [...header.nodes]
  let innerY = header.height

  const flush = () => {
    b.placeSection(b.node('section', x, sectionY, w, innerY, { ...bodyStyleFor }, { sectionType, children }))
  }

  for (let i = 0; i < entries.length; i++) {
    const { nodes, height, entryId } = entries[i]
    let gap = i === 0 ? 0 : entryGap

    if (b.willOverflow(innerY + gap + height)) {
      flush()
      header = buildHeader(true)
      b.ensureSpace(header.height + height)
      sectionY = b.y
      children = [...header.nodes]
      innerY = header.height
      gap = 0
    }

    innerY += gap

    // Entries with a known Resume id get wrapped in an 'entry' node (local
    // coordinates preserved for its children) so the canvas can select and
    // the Delete key can target one specific entry. Entries without an id
    // (summary/skills/custom paths) keep the original flattened placement.
    if (entryId) {
      // Only the four entry-bearing builders (buildExperienceEntry, buildEducationEntry,
      // buildProjectEntry, buildCertEntry) set `entryId`, so `sectionType` here is always
      // one of EntrySectionType — summary/skills/custom entries never populate it.
      children.push(b.node('entry', entryInsetPt, innerY, w - entryInsetPt, height, {}, {
        children: nodes,
        editRef: { kind: 'entry', sectionType: sectionType as EntrySectionType, entryId },
      }))
    } else {
      for (const node of nodes) {
        children.push({ ...node, xPt: node.xPt + entryInsetPt, yPt: node.yPt + innerY })
      }
    }
    innerY += height
  }

  flush()
}

function placeSection(
  b: LayoutBuilder,
  sectionType: SectionType,
  title: string,
  x: number,
  w: number,
  entries: EntryResult[],
  entryGap: number,
  c: RenderCtx,
  customSectionId?: string
): void {
  const { theme, fp, forceBlack, uppercase } = c
  const colors = theme.colors

  const buildHeader = (continued: boolean): SectionHeaderResult => {
    const titleH = fp.scale.sectionTitle * fp.lineHeight.heading
    const nodes: LayoutNode[] = []
    const label = continued ? `${title} (continued)` : title
    nodes.push(tn(b, 'text', 0, 0, w, titleH, {
        ...sectionTitleStyle(colors, fp, forceBlack, uppercase),
        color: colors.textPrimary,
        fontWeight: 700
    }, uppercase || continued ? label.toUpperCase() : label, continued
      ? undefined
      : customSectionId
        ? { kind: 'custom-section-title', sectionId: customSectionId, defaultValue: title }
        : sectionType === 'custom'
          ? undefined
          : { kind: 'section-title', sectionType, defaultValue: title }))
    nodes.push(tn(b, 'divider', 0, titleH + 6, w, 1, { color: colors.divider }))
    return { nodes, height: titleH + 24 }
  }

  placeEntryBlock(b, sectionType, x, w, entries, entryGap, buildHeader, {
    fontFamily: fp.bodyFamily, fontSize: fp.scale.body, fontWeight: 400,
    color: colors.textPrimary, lineHeight: fp.lineHeight.body, textAlign: 'left',
  })
  b.advanceY(30) // Deep section gaps
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

const TITLES: Record<SectionType, string> = {
  summary: 'Professional Summary', experience: 'Work Experience', education: 'Education',
  skills: 'Skills & Expertise', projects: 'Key Projects', certifications: 'Certifications', custom: 'Additional Information',
}

export function renderSectionSingleColumn(c: RenderCtx, sectionType: SectionType, resume: Resume): void {
  const { builder: b, theme, fp, forceBlack } = c
  const colors = theme.colors
  const { x, w } = getXW(c)
  const defaultTitle = TITLES[sectionType]
  const title = sectionType === 'custom'
    ? defaultTitle
    : resume.sectionTitles?.[sectionType] ?? defaultTitle

  switch (sectionType) {
    case 'summary': {
      if (!resume.summary.visible || !resume.summary.content) return
      const h = estimateTextHeight(resume.summary.content, w, fp.scale.body, 1.5)
      placeSection(b, 'summary', title, x, w, [{ 
          nodes: [tn(b, 'text', 0, 0, w, h, { ...bodyStyle(colors, fp, forceBlack), lineHeight: 1.5, color: colors.textSecondary }, resume.summary.content, { kind: 'summary' })],
          height: h 
      }], 0, c)
      break
    }
    case 'experience': {
      const visible = resume.experience.filter(e => e.visible)
      if (!visible.length) return
      placeSection(b, 'experience', title, x, w, visible.map(e => buildExperienceEntry(b, e, w, colors, fp, forceBlack)), 20, c)
      break
    }
    case 'education': {
      const visible = resume.education.filter(e => e.visible)
      if (!visible.length) return
      placeSection(b, 'education', title, x, w, visible.map(e => buildEducationEntry(b, e, w, colors, fp, forceBlack)), 16, c)
      break
    }
    case 'skills': {
      const visible = resume.skills.filter(s => s.visible)
      if (!visible.length) return
      placeSection(b, 'skills', title, x, w, visible.map(s => buildSkillPills(b, s, w, colors, fp, forceBlack)), 10, c)
      break
    }
    case 'projects': {
      const visible = resume.projects.filter(p => p.visible)
      if (!visible.length) return
      placeSection(b, 'projects', title, x, w, visible.map(p => buildProjectEntry(b, p, w, colors, fp, forceBlack)), 20, c)
      break
    }
    case 'certifications': {
      const visible = resume.certifications.filter(cert => cert.visible)
      if (!visible.length) return
      placeSection(b, 'certifications', title, x, w, visible.map(cert => buildCertEntry(b, cert, w, colors, fp, forceBlack)), 12, c)
      break
    }
    case 'custom': {
      for (const cs of resume.customSections.filter(s => s.visible && s.items.length > 0)) {
        const text = cs.items.map(i => i.title).join(', ')
        const h = estimateTextHeight(text, w, fp.scale.body, 1.5)
        placeSection(b, 'custom', cs.title, x, w, [{ 
            nodes: [tn(b, 'text', 0, 0, w, h, { ...bodyStyle(colors, fp, forceBlack), lineHeight: 1.5 }, text)], 
            height: h 
        }], 0, c, cs.id)
      }
      break
    }
  }
}
