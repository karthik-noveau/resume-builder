import type { Resume } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'

/**
 * ATS scoring.
 *
 * This used to be a fixed number written on each template definition and
 * displayed as "ATS Score: 92%", which read as an assessment of the user's
 * résumé while being nothing of the sort. The score is now derived: part of it
 * from properties of the template that genuinely affect machine parsing, and
 * part from the content of the résumé itself.
 *
 * The numbers are a heuristic, not a simulation of any particular applicant
 * tracking system — hence `TEMPLATE_MAX` / `CONTENT_MAX` being exposed, so the
 * UI can be explicit about what has and has not been assessed.
 */

export const TEMPLATE_MAX = 60
export const CONTENT_MAX = 40

export interface AtsFactor {
  label: string
  points: number
  max: number
  /** Shown when points < max, to say what would improve the score. */
  hint?: string
}

export interface AtsResult {
  /** Template + content when a résumé is supplied, template only otherwise. */
  score: number
  templateScore: number
  contentScore: number | null
  factors: AtsFactor[]
}

/** Structural properties of the layout that affect how reliably a parser reads it. */
export function scoreTemplate(template: TemplateDefinition): { score: number; factors: AtsFactor[] } {
  const factors: AtsFactor[] = []

  // Reading order is the single biggest parsing factor: a sidebar interleaves
  // two columns in the text layer, so parsers commonly emit them jumbled.
  const singleColumn = template.layout === 'single-column'
  factors.push({
    label: 'Reading order',
    points: singleColumn ? 30 : 12,
    max: 30,
    hint: singleColumn ? undefined : 'Two-column layouts can be read out of order by parsers',
  })

  const hasPhotoRegion = template.exportRules.includeProfileImage
  factors.push({
    label: 'No photo region',
    points: hasPhotoRegion ? 6 : 15,
    max: 15,
    hint: hasPhotoRegion ? 'Photos are ignored or mis-parsed by most systems' : undefined,
  })

  // Every template embeds real fonts and emits selectable text rather than
  // outlines or images, so this is currently constant across the library.
  factors.push({ label: 'Selectable embedded text', points: 15, max: 15 })

  return { score: factors.reduce((n, f) => n + f.points, 0), factors }
}

/** Content signals — the parts of the résumé a parser actually looks for. */
export function scoreContent(resume: Resume): { score: number; factors: AtsFactor[] } {
  const info = resume.personalInfo
  const factors: AtsFactor[] = []

  const contactComplete = Boolean(info.email && info.phone && info.location)
  factors.push({
    label: 'Contact details',
    points: contactComplete ? 10 : 0,
    max: 10,
    hint: contactComplete ? undefined : 'Add email, phone and location',
  })

  const hasSummary = resume.summary.visible && resume.summary.content.trim().length > 0
  factors.push({
    label: 'Professional summary',
    points: hasSummary ? 5 : 0,
    max: 5,
    hint: hasSummary ? undefined : 'A short summary gives parsers a keyword-rich opening',
  })

  const experience = resume.experience.filter((e) => e.visible)
  const datedRoles = experience.filter((e) => e.role && e.company && e.startDate)
  factors.push({
    label: 'Dated work history',
    points: datedRoles.length > 0 ? 10 : 0,
    max: 10,
    hint: datedRoles.length > 0 ? undefined : 'Give each role a title, employer and start date',
  })

  // Quantified achievements are what recruiters filter on, and a digit is a
  // cheap proxy for "this bullet contains a measurable outcome".
  const quantified = experience.some((e) => e.description.some((b) => /\d/.test(b)))
  factors.push({
    label: 'Quantified achievements',
    points: quantified ? 5 : 0,
    max: 5,
    hint: quantified ? undefined : 'Include numbers — percentages, revenue, team size',
  })

  const hasSkills = resume.skills.some((s) => s.visible && s.skills.length > 0)
  factors.push({
    label: 'Skills section',
    points: hasSkills ? 5 : 0,
    max: 5,
    hint: hasSkills ? undefined : 'List the tools and skills named in the job posting',
  })

  const hasEducation = resume.education.some((e) => e.visible && e.institution.trim())
  factors.push({
    label: 'Education',
    points: hasEducation ? 5 : 0,
    max: 5,
    hint: hasEducation ? undefined : 'Add at least one institution',
  })

  return { score: factors.reduce((n, f) => n + f.points, 0), factors }
}

/**
 * Combined score. Pass `null` for the résumé to rate the template alone — the
 * gallery does this before a résumé exists, and reports it as a template
 * rating out of TEMPLATE_MAX rather than a percentage.
 */
export function calculateAtsScore(template: TemplateDefinition, resume: Resume | null): AtsResult {
  const t = scoreTemplate(template)
  if (!resume) {
    return { score: t.score, templateScore: t.score, contentScore: null, factors: t.factors }
  }
  const c = scoreContent(resume)
  return {
    score: t.score + c.score,
    templateScore: t.score,
    contentScore: c.score,
    factors: [...t.factors, ...c.factors],
  }
}
