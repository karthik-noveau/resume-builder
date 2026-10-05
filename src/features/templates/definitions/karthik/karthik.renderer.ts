import type { Resume, SectionType } from '@/shared/types/resume.types'
import type { EditRef, LayoutNode, LayoutStyles, EntrySectionType } from '@/shared/types/layout.types'
import type { FontPreset } from '@/shared/types/font.types'
import { resolveTemplateColors } from '@/shared/utils/templateColors'
import { LayoutBuilder } from '../../engine/layout.builder'
import { registerRenderer, type TemplateRenderFn } from '../../engine/template.renderer'
import { applyResumeTypography, resolveTemplateTypography, estimateStyledTextHeight, displayUrl, resumeSpacingMultiplier, avgGlyphWidth } from '../../engine/layout.utils'
import { buildContactLineNodes, contactItems } from '../../engine/contact.layout'
import { resolveSectionIcon } from '../../engine/icons'
import { placeEntryBlock, type EntryResult } from '../../engine/section.renderers'
import { measureTextWidth } from '@/shared/utils/textMeasurement'

const TITLES: Record<SectionType, string> = {
  summary: 'Career Objective', education: 'Education', experience: 'Experience',
  skills: 'Skills', projects: 'Projects', certifications: 'Certifications', custom: 'Additional Information',
}

type Palette = ReturnType<typeof resolveTemplateColors>
const dateRange = (start?: string, end?: string) => [start, end === start ? '' : end].filter(Boolean).join(' – ')
const SPACING = {
  portrait: 72, portraitGap: 20, contactRow: 3, beforeContacts: 8,
  headline: 3, headerRule: 16, afterHeader: 16,
  sectionInset: 24, sectionIcon: 13, afterHeading: 8,
  row: 2, bullet: 3, entry: 14, skillGroup: 8, section: 16,
}

function textNode(b: LayoutBuilder, content: string, x: number, y: number, w: number,
  styles: LayoutStyles, editRef?: EditRef): LayoutNode {
  const height = estimateStyledTextHeight(content, w, styles.fontSize, styles.lineHeight,
    styles.letterSpacing ?? 0, styles.fontFamily, styles.fontWeight)
  return b.node('text', x, y, w, height, styles, { content, editRef })
}

function bodyStyle(fp: FontPreset, c: Palette): LayoutStyles {
  return { fontFamily: fp.bodyFamily, fontSize: fp.scale.body, fontWeight: 400,
    lineHeight: fp.lineHeight.body, color: c.sectionDescription, textAlign: 'left' }
}

function header(b: LayoutBuilder, resume: Resume, fp: FontPreset, c: Palette) {
  const info = resume.personalInfo
  const photo = resume.settings.showProfileImage && info.profileImage
  const photoSize = photo ? Math.min(SPACING.portrait, b.contentW * 0.16) : 0
  const nameX = photo ? photoSize + SPACING.portraitGap : 0
  const nameW = b.contentW - nameX
  const text = bodyStyle(fp, c)
  const name = textNode(b, (info.fullName || 'Your Name').toUpperCase(), b.x + nameX, 0, nameW, {
    ...text, fontSize: fp.scale.name, fontWeight: 700, color: c.primaryText, lineHeight: fp.lineHeight.heading,
  }, { kind: 'personal-info', field: 'fullName' })
  const headline = info.headline ? textNode(b, info.headline, b.x + nameX, 0, nameW, {
    ...text, fontSize: fp.scale.headline,
  }, { kind: 'personal-info', field: 'headline' }) : undefined
  let identityH = name.heightPt + (headline ? headline.heightPt + SPACING.headline : 0)
  const rows: LayoutNode[] = []
  for (const fields of [
    ['location', 'phone', 'email'] as const,
    ['portfolio', 'website', 'linkedin', 'github'] as const,
  ]) {
    const items = contactItems(info, [...fields])
    if (!items.length) continue
    identityH += rows.length ? SPACING.contactRow : SPACING.beforeContacts
    const row = buildContactLineNodes(b, items, b.x + nameX, identityH, nameW,
      { ...text, fontSize: fp.scale.caption, color: c.mutedText })
    rows.push(...row.nodes)
    identityH += row.height
  }
  const height = Math.max(photoSize, identityH)
  b.ensureSpace(height + SPACING.headerRule + SPACING.afterHeader)
  const top = b.y
  name.yPt = top + (height - identityH) / 2
  if (headline) headline.yPt = name.yPt + name.heightPt + SPACING.headline
  b.currentPage.nodes.push(name, ...(headline ? [headline] : []))
  if (photo) b.currentPage.nodes.push(b.node('image', b.x, top + (height - photoSize) / 2, photoSize, photoSize, {}, {
    imageId: photo, clipShape: 'circle', panelTarget: 'personal-info', panelField: 'profileImage',
  }))
  b.currentPage.nodes.push(...rows.map(node => ({ ...node, yPt: top + (height - identityH) / 2 + node.yPt })))
  b.advanceY(height + SPACING.headerRule)
  b.currentPage.nodes.push(b.node('divider', b.x, b.y, b.contentW, 0.6, { color: c.divider }))
  b.advanceY(SPACING.afterHeader)
}

interface InlineField { content?: string; ref?: EditRef }

/** Compact rows retain separate fields for canvas editing and wrap as needed. */
function entryBuilder(b: LayoutBuilder, w: number, fp: FontPreset, c: Palette) {
  const nodes: LayoutNode[] = []
  let y = 0
  const gap = SPACING.row
  let trailingGap = gap
  const line = (content: string | undefined, ref?: EditRef, style: Partial<LayoutStyles> = {}) => {
    if (!content) return
    const node = textNode(b, content, 0, y, w, { ...bodyStyle(fp, c), ...style }, ref)
    nodes.push(node)
    y += node.heightPt + gap
    trailingGap = gap
  }
  const titleStyle: Partial<LayoutStyles> = { fontSize: fp.scale.entryTitle, fontWeight: 600, color: c.primaryText }
  const muted: Partial<LayoutStyles> = { fontSize: fp.scale.small, color: c.mutedText }
  const link = (value: string, ref?: EditRef) => line(displayUrl(value), ref, { fontSize: fp.scale.small, color: c.accent })
  const inline = (fields: InlineField[], style: Partial<LayoutStyles> = {}, separator = ' · ') => {
    const textStyle = { ...bodyStyle(fp, c), ...style }
    const widthOf = (value: string) => measureTextWidth(value, textStyle.fontSize, textStyle.fontFamily, textStyle.fontWeight)
      ?? value.length * avgGlyphWidth(value, textStyle.fontSize)
    const separatorW = widthOf(separator) + 2
    let x = 0
    let rowH = 0
    for (const field of fields.filter(item => item.content)) {
      const width = Math.min(w, widthOf(field.content!) + 2)
      if (x && x + separatorW + width > w) {
        y += rowH + gap
        x = 0
        rowH = 0
      }
      if (x) {
        nodes.push(textNode(b, separator, x, y, separatorW, textStyle))
        x += separatorW
      }
      const node = textNode(b, field.content!, x, y, width, textStyle, field.ref)
      nodes.push(node)
      x += width
      rowH = Math.max(rowH, node.heightPt)
    }
    if (rowH) {
      y += rowH + gap
      trailingGap = gap
    }
  }
  const heading = (title: string, ref: EditRef, date: string, dateRef?: EditRef) => {
    const dateW = date ? Math.min(116, w * 0.3) : 0
    const titleNode = textNode(b, title, 0, y, w - (dateW ? dateW + 12 : 0), { ...bodyStyle(fp, c), ...titleStyle }, ref)
    nodes.push(titleNode)
    let height = titleNode.heightPt
    if (date) {
      const dateNode = textNode(b, date, w - dateW, y + 1, dateW, { ...bodyStyle(fp, c), ...muted, textAlign: 'right' }, dateRef)
      nodes.push(dateNode)
      height = Math.max(height, dateNode.heightPt + 1)
    }
    y += height + gap
    trailingGap = gap
  }
  const bullet = (text: string, ref?: EditRef) => {
    if (!text) return
    const node = textNode(b, text, 10, y, w - 10, bodyStyle(fp, c), ref)
    nodes.push(textNode(b, '•', 0, y, 7, { ...bodyStyle(fp, c), color: c.accent }), node)
    y += node.heightPt + SPACING.bullet
    trailingGap = SPACING.bullet
  }
  const result = (entryId?: string): EntryResult => ({ nodes, height: Math.max(0, y - trailingGap), entryId })
  return { line, inline, heading, bullet, link, titleStyle, muted, result }
}

function entriesFor(b: LayoutBuilder, type: SectionType, resume: Resume, w: number, fp: FontPreset, c: Palette): EntryResult[] {
  const make = () => entryBuilder(b, w, fp, c)
  const ref = (sectionType: EntrySectionType, entryId: string, field: string): EditRef =>
    ({ kind: 'entry-field', sectionType, entryId, field })
  switch (type) {
    case 'summary': {
      if (!resume.summary.visible || !resume.summary.content) return []
      const row = make()
      row.line(resume.summary.content, { kind: 'summary' })
      return [row.result()]
    }
    case 'experience': return resume.experience.filter(e => e.visible).map(e => {
      const row = make()
      row.heading(e.role || 'Role', ref(type, e.id, 'role'), dateRange(e.startDate, e.current ? 'Present' : e.endDate))
      row.inline([{ content: e.company, ref: ref(type, e.id, 'company') }, { content: e.location, ref: ref(type, e.id, 'location') }], { color: c.mutedText })
      e.description.forEach((text, index) => {
        row.bullet(text, { kind: 'entry-list-item', sectionType: 'experience', entryId: e.id, field: 'description', index })
      })
      row.line(e.technologies.join(' · '), undefined, row.muted)
      return row.result(e.id)
    })
    case 'education': return resume.education.filter(e => e.visible).map(e => {
      const row = make()
      row.inline([{ content: e.degree || 'Degree', ref: ref(type, e.id, 'degree') }, { content: e.fieldOfStudy, ref: ref(type, e.id, 'fieldOfStudy') }], row.titleStyle, ' ')
      row.inline([{ content: e.institution, ref: ref(type, e.id, 'institution') }, { content: e.location, ref: ref(type, e.id, 'location') }])
      row.inline([{ content: dateRange(e.startDate, e.endDate) }, { content: e.grade, ref: ref(type, e.id, 'grade') }], row.muted)
      e.description.forEach(text => row.bullet(text))
      return row.result(e.id)
    })
    case 'skills': return resume.skills.filter(e => e.visible).map(group => {
      const categoryW = group.category ? Math.min(64, w * 0.22) : 0
      const skillX = categoryW ? categoryW + 12 : 0
      const category = group.category ? textNode(b, group.category, 0, 0, categoryW, { ...bodyStyle(fp, c), fontWeight: 600, color: c.primaryText }) : undefined
      const row = entryBuilder(b, w - skillX, fp, c)
      row.inline(group.skills.map(skill => ({ content: skill.name })))
      const result = row.result()
      return {
        nodes: [...(category ? [category] : []), ...result.nodes.map(node => ({ ...node, xPt: node.xPt + skillX }))],
        height: Math.max(category?.heightPt ?? 0, result.height),
      }
    })
    case 'projects': return resume.projects.filter(e => e.visible).map(e => {
      const row = make()
      row.heading(e.title || 'Project', ref(type, e.id, 'title'), dateRange(e.startDate, e.endDate))
      row.line(e.technologies.join(' · '), undefined, row.muted)
      row.line(e.description, ref(type, e.id, 'description'))
      row.link(e.url, ref(type, e.id, 'url'))
      row.link(e.github, ref(type, e.id, 'github'))
      return row.result(e.id)
    })
    case 'certifications': return resume.certifications.filter(e => e.visible).map(e => {
      const row = make()
      row.heading(e.title || 'Certification', ref(type, e.id, 'title'), e.issueDate, ref(type, e.id, 'issueDate'))
      row.line(e.issuer, ref(type, e.id, 'issuer'))
      row.line(e.credentialId, ref(type, e.id, 'credentialId'), row.muted)
      row.link(e.credentialUrl, ref(type, e.id, 'credentialUrl'))
      return row.result(e.id)
    })
    case 'custom': return []
  }
}

const render: TemplateRenderFn = (resume, template, theme, preset) => {
  const fp = applyResumeTypography(resolveTemplateTypography(preset, {
    headingFamily: 'SourceSerifPro', bodyFamily: 'IBMPlexSans',
    scale: { name: 28, headline: 11, sectionTitle: 12, entryTitle: 11, body: 10.5, small: 9, caption: 9 },
    lineHeight: { heading: 1.12, body: 1.3 },
  }), resume.settings)
  const c = resolveTemplateColors(resume)
  const b = new LayoutBuilder({ resumeId: resume.id, templateId: template.id, themeId: theme.id,
    fontPresetId: preset.id, pageSize: resume.settings.pageSize, marginMm: resume.settings.margins })
  header(b, resume, fp, c)
  const x = b.x
  const w = b.contentW
  const inset = SPACING.sectionInset
  const spacing = resumeSpacingMultiplier(resume.settings)
  const place = (type: SectionType, title: string, entries: EntryResult[], customId?: string) => {
    if (!entries.length) return
    placeEntryBlock(b, type, x, w, entries, (type === 'skills' ? SPACING.skillGroup : SPACING.entry) * spacing, continued => {
      const label = `${title}${continued ? ' (continued)' : ''}`.toUpperCase()
      const editRef: EditRef | undefined = continued ? undefined : customId
        ? { kind: 'custom-section-title', sectionId: customId, defaultValue: title }
        : type === 'custom' ? undefined : { kind: 'section-title', sectionType: type, defaultValue: TITLES[type] }
      const text = textNode(b, label, inset, 0, w - inset, { ...bodyStyle(fp, c), fontFamily: fp.headingFamily,
        fontSize: fp.scale.sectionTitle, fontWeight: 400, letterSpacing: 0.04,
        lineHeight: fp.lineHeight.heading, color: c.sectionTitle }, editRef)
      const size = SPACING.sectionIcon
      const height = Math.max(size, text.heightPt)
      text.yPt = (height - text.heightPt) / 2
      return { nodes: [b.node('icon', 0, (height - size) / 2, size, size, { color: c.accent }, {
        iconName: resolveSectionIcon(resume, type, template.sectionIcons![type]!, customId), iconEditable: true,
      }), text], height: height + SPACING.afterHeading }
    }, bodyStyle(fp, c), inset)
    b.advanceY(SPACING.section * spacing)
  }
  for (const type of resume.sectionOrder) {
    if (type === 'custom') {
      for (const section of resume.customSections.filter(s => s.visible && s.items.length)) {
        const entries = section.items.map(item => {
          const row = entryBuilder(b, w - inset, fp, c)
          row.line(item.title, undefined, row.titleStyle)
          row.line(item.subtitle)
          row.line(item.description)
          row.line(dateRange(item.startDate, item.endDate), undefined, row.muted)
          if (item.url) row.link(item.url)
          return row.result()
        })
        place(type, section.title, entries, section.id)
      }
    } else place(type, resume.sectionTitles?.[type] ?? TITLES[type], entriesFor(b, type, resume, w - inset, fp, c))
  }
  return b.build()
}

registerRenderer('karthik', render)
