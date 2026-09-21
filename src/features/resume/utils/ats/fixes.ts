import type { Resume } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import {
  cleanBullet,
  dateMonth,
  normalize,
  STANDARD_HEADINGS,
  unusualHeadings,
  visible,
  type AtsFix,
} from './evaluate'

export interface AtsFixPlan {
  title: string
  changes: { label: string; before: string; after: string }[]
  patch: Partial<Resume>
}

/** Generate a fresh, reviewable patch. No generated achievements, dates, or skills. */
export function planAtsFix(
  kind: AtsFix,
  resume: Resume,
  templates: TemplateDefinition[]
): AtsFixPlan | null {
  const changes: AtsFixPlan['changes'] = []
  let patch: Partial<Resume> = {}
  let title = ''
  if (kind === 'hide-photo' && resume.settings.showProfileImage) {
    title = 'Hide the profile image'
    changes.push({
      label: 'Profile image',
      before: 'Shown on resume',
      after: 'Hidden; uploaded image and avatar settings are kept',
    })
    patch = { settings: { ...resume.settings, showProfileImage: false } }
  }
  if (kind === 'single-column') {
    const template =
      templates.find((t) => t.layout === 'single-column' && t.name === 'Clarity') ??
      templates.find((t) => t.layout === 'single-column')
    if (template && template.id !== resume.templateId) {
      title = 'Use a single-column layout'
      changes.push({
        label: 'Template',
        before: templates.find((t) => t.id === resume.templateId)?.name ?? resume.templateId,
        after: `${template.name} — your content and styling preferences are kept`,
      })
      patch = { templateId: template.id }
    }
  }
  if (kind === 'headings') {
    title = 'Use familiar section headings'
    const sectionTitles = { ...resume.sectionTitles }
    for (const [key, value] of unusualHeadings(resume)) {
      sectionTitles[key] = STANDARD_HEADINGS[key]
      changes.push({ label: key, before: value, after: STANDARD_HEADINGS[key] })
    }
    patch = { sectionTitles }
  }
  if (kind === 'deduplicate-skills') {
    title = 'Remove duplicate skills'
    patch = {
      skills: resume.skills.map((group) => {
        if (!group.visible || !resume.sectionOrder.includes('skills')) return group
        const seen = new Set<string>()
        // Keep the full first record, including its level and ID.
        const skills = group.skills.filter((skill) => {
          const key = normalize(skill.name)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        if (skills.length === group.skills.length) return group
        changes.push({
          label: group.category || 'Skills',
          before: group.skills.map((s) => s.name).join(', '),
          after: skills.map((s) => s.name).join(', '),
        })
        return { ...group, skills }
      }),
    }
  }
  if (kind === 'clean-bullets') {
    title = 'Clean up work-history bullets'
    patch = {
      experience: resume.experience.map((entry) => {
        if (!entry.visible || !resume.sectionOrder.includes('experience')) return entry
        const seen = new Set<string>()
        const description = entry.description.map(cleanBullet).filter((text) => {
          if (!text || seen.has(normalize(text))) return false
          seen.add(normalize(text))
          return true
        })
        if (JSON.stringify(description) === JSON.stringify(entry.description)) return entry
        changes.push({
          label: entry.role || entry.company || 'Experience',
          before: entry.description.join('\n'),
          after: description.join('\n'),
        })
        return { ...entry, description }
      }),
    }
  }
  if (kind === 'sort-experience') {
    title = 'Put recent experience first'
    const roles = visible(resume, 'experience', resume.experience)
    if (!roles.every((role) => dateMonth(role.startDate) !== null)) return null
    const sorted = [...roles].sort((a, b) => dateMonth(b.startDate)! - dateMonth(a.startDate)!)
    const ordered = [...resume.experience].sort((a, b) => a.order - b.order)
    let index = 0
    const experience = ordered.map((entry, order) => ({
      ...(roles.includes(entry) ? sorted[index++] : entry),
      order,
    }))
    const before = ordered
      .filter((e) => e.visible)
      .map((e) => `${e.role || e.company} (${e.startDate})`)
      .join('\n')
    const after = experience
      .filter((e) => e.visible)
      .map((e) => `${e.role || e.company} (${e.startDate})`)
      .join('\n')
    if (before !== after) changes.push({ label: 'Experience order', before, after })
    patch = { experience }
  }
  return changes.length ? { title, changes, patch } : null
}
