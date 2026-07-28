import type {
  SummarySection,
  ExperienceSection,
  EducationSection,
  SkillSection,
  ProjectSection,
  CertificationSection,
  CustomSection,
} from '@/shared/types/resume.types'

function now(): string {
  return new Date().toISOString()
}

export function createEmptySummary(): SummarySection {
  return {
    id: crypto.randomUUID(),
    type: 'summary',
    visible: true,
    order: 0,
    createdAt: now(),
    updatedAt: now(),
    content: '',
  }
}

export function createEmptyExperience(order = 0): ExperienceSection {
  return {
    id: crypto.randomUUID(),
    type: 'experience',
    visible: true,
    order,
    createdAt: now(),
    updatedAt: now(),
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: [],
    technologies: [],
  }
}

export function createEmptyEducation(order = 0): EducationSection {
  return {
    id: crypto.randomUUID(),
    type: 'education',
    visible: true,
    order,
    createdAt: now(),
    updatedAt: now(),
    institution: '',
    degree: '',
    fieldOfStudy: '',
    location: '',
    startDate: '',
    endDate: '',
    grade: '',
    description: [],
  }
}

export function createEmptySkillSection(order = 0): SkillSection {
  return {
    id: crypto.randomUUID(),
    type: 'skills',
    visible: true,
    order,
    createdAt: now(),
    updatedAt: now(),
    category: 'Skills',
    skills: [],
  }
}

export function createEmptyProject(order = 0): ProjectSection {
  return {
    id: crypto.randomUUID(),
    type: 'projects',
    visible: true,
    order,
    createdAt: now(),
    updatedAt: now(),
    title: '',
    description: '',
    technologies: [],
    url: '',
    github: '',
    startDate: '',
    endDate: '',
  }
}

export function createEmptyCertification(order = 0): CertificationSection {
  return {
    id: crypto.randomUUID(),
    type: 'certifications',
    visible: true,
    order,
    createdAt: now(),
    updatedAt: now(),
    title: '',
    issuer: '',
    issueDate: '',
    credentialId: '',
    credentialUrl: '',
  }
}

export function createEmptyCustomSection(order = 0): CustomSection {
  return {
    id: crypto.randomUUID(),
    type: 'custom',
    visible: true,
    order,
    createdAt: now(),
    updatedAt: now(),
    title: 'Custom Section',
    items: [],
  }
}
