import type { Resume } from '@/shared/types/resume.types'
import { personalInfoSchema } from '@/shared/schemas/personalInfo.schema'
import { sampleContent } from '@/features/resume/utils/resume.factory'

export type GuidedStep = 'personal' | 'summary' | 'experience' | 'education' | 'skills'

export const GUIDED_STEP_LABELS: Record<GuidedStep, string> = {
  personal: 'Personal details',
  summary: 'Summary',
  experience: 'Work experience',
  education: 'Education',
  skills: 'Skills',
}

/** Completion requirements belong to guided setup, not the draft/storage schema. */
export function getGuidedStepErrors(resume: Resume, step: GuidedStep): string[] {
  const errors: string[] = []
  const required = (value: string, label: string) => {
    if (!value.trim()) errors.push(`${label} is required.`)
  }
  switch (step) {
    case 'personal': {
      required(resume.personalInfo.fullName, 'Full name')
      required(resume.personalInfo.email, 'Email')
      const result = personalInfoSchema.safeParse(resume.personalInfo)
      if (!result.success) errors.push(...result.error.issues.map((issue) => issue.message))
      break
    }
    case 'summary':
      required(resume.summary.content, 'Summary')
      break
    case 'experience':
      if (!resume.experience.length) errors.push('Add at least one work experience entry.')
      resume.experience.forEach((entry, i) => {
        required(entry.company, `Company for experience ${i + 1}`)
        required(entry.role, `Role / Job title for experience ${i + 1}`)
      })
      break
    case 'education':
      if (!resume.education.length) errors.push('Add at least one education entry.')
      resume.education.forEach((entry, i) => {
        required(entry.institution, `Institution for education ${i + 1}`)
        required(entry.degree, `Degree for education ${i + 1}`)
      })
      break
    case 'skills':
      if (!resume.skills.length) errors.push('Add a skill category with at least one skill.')
      resume.skills.forEach((entry, i) => {
        required(entry.category, `Category name for skill group ${i + 1}`)
        if (!entry.skills.length) errors.push(`Add at least one skill to skill group ${i + 1}.`)
        entry.skills.forEach((skill) => required(skill.name, `Skill name in group ${i + 1}`))
      })
      break
  }
  return errors
}

export function hasGuidedStepContent(resume: Resume, step: GuidedStep): boolean {
  if (step === 'personal') {
    return Object.values(resume.personalInfo).some((value: unknown) => typeof value === 'string' && !!value.trim())
  }
  if (step === 'summary') return !!resume.summary.content.trim()
  return resume[step].length > 0
}

/** Only the current section is replaced; its heading and all other sections survive. */
export function getGuidedMockPatch(resume: Resume, step: GuidedStep): Partial<Resume> {
  const sample = sampleContent()
  switch (step) {
    case 'personal':
      return { personalInfo: { ...resume.personalInfo, ...sample.personalInfo } }
    case 'summary':
      return { summary: { ...resume.summary, content: sample.summary.content } }
    case 'experience': return { experience: sample.experience }
    case 'education': return { education: sample.education }
    case 'skills': return { skills: sample.skills }
  }
}
