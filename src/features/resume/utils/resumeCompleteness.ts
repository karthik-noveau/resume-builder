import type { Resume } from '@/shared/types/resume.types'

/** Weighted 0-100 estimate of how filled-in a resume is, for the Sidebar's profile-strength readout. */
export function calculateCompleteness(resume: Resume): number {
  let score = 0

  const { personalInfo } = resume
  const personalFields = [personalInfo.fullName, personalInfo.email, personalInfo.phone, personalInfo.headline]
  const personalFilled = personalFields.filter((f) => f.trim().length > 0).length
  score += (personalFilled / personalFields.length) * 30

  if (resume.summary.content.trim().length > 0) score += 15

  const hasExperience = resume.experience.some((e) => e.role.trim() && e.company.trim())
  if (hasExperience) score += 25

  const hasEducation = resume.education.some((e) => e.institution.trim())
  if (hasEducation) score += 15

  const hasSkills = resume.skills.some((s) => s.skills.length > 0)
  if (hasSkills) score += 15

  return Math.round(score)
}
