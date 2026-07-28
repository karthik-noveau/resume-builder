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
  estimateBulletHeight,
  displayUrl,
  nameStyle,
  sectionTitleStyle,
  entryTitleStyle,
  bodyStyle,
  smallStyle,
  captionStyle,
  metadataStyle,
} from './layout.utils'

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

  const contactText = [info.location, info.phone, info.email, displayUrl(info.website)].filter(Boolean).join('   •   ')
  if (contactText) {
    const cH = fp.scale.small * 1.5
    b.currentPage.nodes.push(tn(b, 'text', x, b.y, w, cH, { 
      ...captionStyle(colors, fp), 
      textAlign: 'center'
    }, contactText))
    b.advanceY(cH)
  }
  b.advanceY(35)
}

// ─── Entry builders ───────────────────────────────────────────────────────────

export type EntryResult = { nodes: LayoutNode[]; height: number; entryId?: string }

export function buildExperienceEntry(b: LayoutBuilder, entry: ExperienceSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const endLabel = entry.current ? 'Present' : entry.endDate
  const dateLine = [entry.startDate, endLabel].filter(Boolean).join(' – ')

  // 2x2 Grid Layout
  // Row 1: Role (Left), Date (Right) — height accounts for wrapping on either side,
  // since narrow (e.g. sidebar/two-column) widths can wrap both columns.
  const roleH = Math.max(
    estimateTextHeight(entry.role || 'Role', w * 0.7, fp.scale.entryTitle, fp.lineHeight.heading),
    estimateTextHeight(dateLine, w * 0.3, fp.scale.small, fp.lineHeight.body)
  )
  nodes.push(tn(b, 'text', 0, iy, w * 0.7, roleH, {
    ...entryTitleStyle(colors, fp, forceBlack),
    color: colors.primary,
    fontWeight: 700
  }, entry.role || 'Role', { kind: 'entry-field', sectionType: 'experience', entryId: entry.id, field: 'role' }))

  nodes.push(tn(b, 'text', w * 0.7, iy, w * 0.3, roleH, {
    ...smallStyle(colors, fp),
    textAlign: 'right',
    fontWeight: 700,
    color: colors.textPrimary
  }, dateLine))
  iy += roleH + 2

  // Row 2: Company (Left), Location (Right)
  const companyH = Math.max(
    estimateTextHeight(entry.company || 'Company', w * 0.7, fp.scale.body, fp.lineHeight.body),
    entry.location ? estimateTextHeight(entry.location, w * 0.3, fp.scale.small, 1.4) : 0
  )
  nodes.push(tn(b, 'text', 0, iy, w * 0.7, companyH, {
    ...bodyStyle(colors, fp, forceBlack),
    fontWeight: 600,
    color: colors.textSecondary
  }, entry.company || 'Company', { kind: 'entry-field', sectionType: 'experience', entryId: entry.id, field: 'company' }))

  nodes.push(tn(b, 'text', w * 0.7, iy, w * 0.3, companyH, {
    ...metadataStyle(colors, fp),
    textAlign: 'right'
  }, entry.location, { kind: 'entry-field', sectionType: 'experience', entryId: entry.id, field: 'location' }))
  iy += companyH + 10

  // Bullets with primary color symbols
  for (const [index, bullet] of entry.description.entries()) {
    if (!bullet) continue
    const bH = estimateBulletHeight(bullet, w, fp.scale.body, fp.lineHeight.body)

    // Accent Bullet
    nodes.push(tn(b, 'text', 0, iy, 12, bH, {
        ...bodyStyle(colors, fp, forceBlack),
        color: colors.primary,
        fontWeight: 800
    }, '•'))

    nodes.push(tn(b, 'text', 14, iy, w - 14, bH, {
        ...bodyStyle(colors, fp, forceBlack),
        lineHeight: 1.45,
        color: colors.textSecondary
    }, bullet, { kind: 'entry-list-item', sectionType: 'experience', entryId: entry.id, field: 'description', index }))
    iy += bH + 5
  }

  return { nodes, height: iy, entryId: entry.id }
}

export function buildEducationEntry(b: LayoutBuilder, entry: EducationSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const degreeText = [entry.degree, entry.fieldOfStudy ? `in ${entry.fieldOfStudy}` : ''].filter(Boolean).join(' ')
  const dateLine = [entry.startDate, entry.endDate].filter(Boolean).join(' – ')

  const degH = Math.max(
    estimateTextHeight(degreeText, w * 0.7, fp.scale.entryTitle, fp.lineHeight.heading),
    estimateTextHeight(dateLine, w * 0.3, fp.scale.small, fp.lineHeight.body)
  )
  nodes.push(tn(b, 'text', 0, iy, w * 0.7, degH, {
    ...entryTitleStyle(colors, fp, forceBlack),
    fontWeight: 700,
    color: colors.primary
  }, degreeText))
  nodes.push(tn(b, 'text', w * 0.7, iy, w * 0.3, degH, {
    ...smallStyle(colors, fp),
    textAlign: 'right',
    fontWeight: 700
  }, dateLine))
  iy += degH + 2

  const gradeText = entry.grade ? `GPA: ${entry.grade}` : ''
  const instH = Math.max(
    estimateTextHeight(entry.institution, w * 0.7, fp.scale.body, fp.lineHeight.body),
    gradeText ? estimateTextHeight(gradeText, w * 0.3, fp.scale.caption, 1.3) : 0
  )
  nodes.push(tn(b, 'text', 0, iy, w * 0.7, instH, { ...bodyStyle(colors, fp, forceBlack), fontWeight: 600 }, entry.institution, { kind: 'entry-field', sectionType: 'education', entryId: entry.id, field: 'institution' }))
  if (gradeText) nodes.push(tn(b, 'text', w * 0.7, iy, w * 0.3, instH, { ...captionStyle(colors, fp), textAlign: 'right', color: colors.accent, fontWeight: 700 }, gradeText))
  iy += instH

  return { nodes, height: iy, entryId: entry.id }
}

export function buildSkillPills(b: LayoutBuilder, section: SkillSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0
  
  const catH = fp.scale.body * fp.lineHeight.body
  nodes.push(tn(b, 'text', 0, iy, w, catH, { 
    ...bodyStyle(colors, fp, forceBlack), 
    fontWeight: 700, 
    color: colors.textPrimary,
    letterSpacing: 0.02
  }, section.category.toUpperCase()))
  iy += catH + 6
  
  const skillsText = section.skills.map(s => s.name).join('   •   ')
  const skillsH = estimateTextHeight(skillsText, w, fp.scale.body, 1.4)
  nodes.push(tn(b, 'text', 0, iy, w, skillsH, {
      ...bodyStyle(colors, fp, forceBlack),
      color: colors.textSecondary,
      lineHeight: 1.4
  }, skillsText))
  
  return { nodes, height: iy + skillsH + 8 }
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

  const nameH = fp.scale.body * fp.lineHeight.body
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

export function buildProjectEntry(b: LayoutBuilder, entry: ProjectSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0

  const dateLine = [entry.startDate, entry.endDate].filter(Boolean).join(' – ')
  const titleH = Math.max(
    estimateTextHeight(entry.title, w * 0.7, fp.scale.entryTitle, fp.lineHeight.heading),
    dateLine ? estimateTextHeight(dateLine, w * 0.3, fp.scale.caption, 1.3) : 0
  )

  nodes.push(tn(b, 'text', 0, iy, w * 0.7, titleH, {
    ...entryTitleStyle(colors, fp, forceBlack),
    fontWeight: 700,
    color: colors.primary
  }, entry.title, { kind: 'entry-field', sectionType: 'projects', entryId: entry.id, field: 'title' }))
  if (dateLine) nodes.push(tn(b, 'text', w * 0.7, iy, w * 0.3, titleH, { ...captionStyle(colors, fp), textAlign: 'right', fontWeight: 700 }, dateLine))
  iy += titleH + 4

  if (entry.technologies && entry.technologies.length > 0) {
    const tagsText = entry.technologies.join('   •   ')
    const tagH = estimateTextHeight(tagsText, w, fp.scale.small, 1.5)
    nodes.push(tn(b, 'text', 0, iy, w, tagH, {
      ...captionStyle(colors, fp),
      color: colors.accent,
      fontWeight: 800,
      backgroundColor: colors.accent + '10',
      paddingLeftPt: 6,
      paddingRightPt: 6
    }, tagsText))
    iy += tagH + 8
  }
  
  if (entry.description) {
    const descH = estimateTextHeight(entry.description, w, fp.scale.body, 1.4)
    nodes.push(tn(b, 'text', 0, iy, w, descH, {
        ...bodyStyle(colors, fp, forceBlack),
        color: colors.textSecondary,
        lineHeight: 1.4
    }, entry.description, { kind: 'entry-field', sectionType: 'projects', entryId: entry.id, field: 'description' }))
    iy += descH + 4
  }

  return { nodes, height: iy, entryId: entry.id }
}

export function buildCertEntry(b: LayoutBuilder, entry: CertificationSection, w: number, colors: Theme['colors'], fp: FontPreset, forceBlack: boolean): EntryResult {
  const nodes: LayoutNode[] = []
  let iy = 0
  const titleH = Math.max(
    estimateTextHeight(entry.title, w * 0.75, fp.scale.body, fp.lineHeight.body),
    entry.issueDate ? estimateTextHeight(entry.issueDate, w * 0.25, fp.scale.caption, 1.3) : 0
  )
  nodes.push(tn(b, 'text', 0, iy, w * 0.75, titleH, { ...bodyStyle(colors, fp, forceBlack), fontWeight: 700 }, entry.title, { kind: 'entry-field', sectionType: 'certifications', entryId: entry.id, field: 'title' }))
  nodes.push(tn(b, 'text', w * 0.75, iy, w * 0.25, titleH, { ...captionStyle(colors, fp), textAlign: 'right', fontWeight: 600 }, entry.issueDate, { kind: 'entry-field', sectionType: 'certifications', entryId: entry.id, field: 'issueDate' }))
  iy += titleH + 2
  const issuerText = `${entry.issuer}${entry.credentialId ? `   |   ${entry.credentialId}` : ''}`
  // Measured with the same line height smallStyle renders at — measuring at a
  // tighter one made the box shorter than the text, so a wrapped issuer ran
  // into whatever followed it.
  const issuerH = estimateTextHeight(issuerText, w, fp.scale.small, fp.lineHeight.body)
  nodes.push(tn(b, 'text', 0, iy, w, issuerH, { ...smallStyle(colors, fp), color: colors.textSecondary, fontWeight: 600 }, issuerText))
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
  bodyStyleFor: Partial<LayoutStyles>
): void {
  if (!entries.length) return

  let header = buildHeader(false)
  b.ensureSpace(header.height + 60)

  let sectionY = b.y
  let children: LayoutNode[] = [...header.nodes]
  let innerY = header.height

  const flush = () => {
    b.placeSection(b.node('section', x, sectionY, w, innerY, { ...bodyStyleFor }, { sectionType, children }))
  }

  for (let i = 0; i < entries.length; i++) {
    const { nodes, height, entryId } = entries[i]

    if (b.willOverflow(innerY + height)) {
      flush()
      b.ensureSpace(height + 40)
      header = buildHeader(true)
      sectionY = b.y
      children = [...header.nodes]
      innerY = header.height
    }

    // Entries with a known Resume id get wrapped in an 'entry' node (local
    // coordinates preserved for its children) so the canvas can select and
    // the Delete key can target one specific entry. Entries without an id
    // (summary/skills/custom paths) keep the original flattened placement.
    if (entryId) {
      // Only the four entry-bearing builders (buildExperienceEntry, buildEducationEntry,
      // buildProjectEntry, buildCertEntry) set `entryId`, so `sectionType` here is always
      // one of EntrySectionType — summary/skills/custom entries never populate it.
      children.push(b.node('entry', 0, innerY, w, height, {}, {
        children: nodes,
        editRef: { kind: 'entry', sectionType: sectionType as EntrySectionType, entryId },
      }))
    } else {
      for (const node of nodes) {
        children.push({ ...node, yPt: node.yPt + innerY })
      }
    }
    innerY += height
    if (i < entries.length - 1) innerY += entryGap
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
  c: RenderCtx
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
    }, uppercase || continued ? label.toUpperCase() : label))
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
  const title = TITLES[sectionType]

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
        }], 0, c)
      }
      break
    }
  }
}
