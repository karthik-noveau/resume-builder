import type { Resume } from '@/shared/types/resume.types'

const hasText = (values: (string | undefined)[]) => values.some((value) => !!value?.trim())

/** Actual, visible resume content — not its title, template placeholder, or empty entry records. */
export function hasResumeContent(resume: Resume): boolean {
  const info = resume.personalInfo
  return hasText([
    info.fullName, info.headline, info.email, info.phone, info.location,
    info.website, info.linkedin, info.github, info.portfolio,
  ]) ||
    (resume.summary.visible && hasText([resume.summary.content])) ||
    resume.experience.some((entry) => entry.visible && hasText([
      entry.company, entry.role, entry.location, entry.startDate, entry.endDate,
      ...entry.description, ...entry.technologies,
    ])) ||
    resume.education.some((entry) => entry.visible && hasText([
      entry.institution, entry.degree, entry.fieldOfStudy, entry.location,
      entry.startDate, entry.endDate, entry.grade, ...entry.description,
    ])) ||
    resume.skills.some((entry) => entry.visible && hasText(entry.skills.map((skill) => skill.name))) ||
    resume.projects.some((entry) => entry.visible && hasText([
      entry.title, entry.description, entry.url, entry.github,
      entry.startDate, entry.endDate, ...entry.technologies,
    ])) ||
    resume.certifications.some((entry) => entry.visible && hasText([
      entry.title, entry.issuer, entry.issueDate, entry.credentialId, entry.credentialUrl,
    ]))
}
