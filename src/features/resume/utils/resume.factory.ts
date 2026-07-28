import type { Resume, ResumeListItem, SectionType } from '@/shared/types/resume.types'
import type { ParsedResumeData } from './resumeParser'

type ResumeDefaults = { themeId?: string; fontPresetId?: string; pageSize?: 'A4' | 'LETTER'; customPrimaryColor?: string }

const DEFAULT_SECTION_ORDER: SectionType[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'custom',
]

/**
 * Builds a new resume pre-filled with realistic sample content (instead of
 * blank fields) so every section renders across all templates immediately —
 * the user edits/replaces the sample rather than starting from an empty page.
 */
export function createEmptyResume(templateId: string, defaults?: ResumeDefaults): Resume {
  const ts = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    title: 'Untitled Resume',
    createdAt: ts,
    updatedAt: ts,
    templateId,
    themeId: defaults?.themeId ?? 'light',
    fontPresetId: defaults?.fontPresetId ?? 'professional',
    customPrimaryColor: defaults?.customPrimaryColor,
    personalInfo: {
      fullName: 'Alex Morgan',
      headline: 'Senior Product Manager',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 123-4567',
      location: 'Austin, TX',
      website: 'https://alexmorgan.dev',
      linkedin: 'https://linkedin.com/in/alexmorgan',
      github: '',
      portfolio: '',
    },
    summary: {
      id: crypto.randomUUID(),
      type: 'summary',
      visible: true,
      order: 0,
      createdAt: ts,
      updatedAt: ts,
      content:
        'Product manager with 7+ years shipping enterprise SaaS products, leading cross-functional teams through discovery, delivery, and growth. Skilled at translating ambiguous customer problems into roadmaps that measurably move revenue and retention.',
    },
    experience: [
      {
        id: crypto.randomUUID(),
        type: 'experience',
        visible: true,
        order: 0,
        createdAt: ts,
        updatedAt: ts,
        company: 'Northwind Systems',
        role: 'Senior Product Manager',
        location: 'Austin, TX',
        startDate: 'Jan 2022',
        endDate: '',
        current: true,
        description: [
          'Led a team of 4 designers and 12 engineers to launch a self-serve onboarding flow, reducing time-to-value from 14 days to 3 days.',
          'Defined and drove the pricing strategy for a new tier, growing net revenue retention from 98% to 112% within two quarters.',
          'Partnered with sales and support leadership to build a customer feedback loop that now informs every quarterly roadmap.',
        ],
        technologies: ['Figma', 'SQL', 'Amplitude'],
      },
      {
        id: crypto.randomUUID(),
        type: 'experience',
        visible: true,
        order: 1,
        createdAt: ts,
        updatedAt: ts,
        company: 'Delta Cloud',
        role: 'Product Manager',
        location: 'Remote',
        startDate: 'Jun 2018',
        endDate: 'Dec 2021',
        current: false,
        description: [
          'Owned the billing and subscriptions platform serving 50,000+ paying customers.',
          'Shipped usage-based billing, unlocking a new enterprise segment worth $2.4M ARR in year one.',
        ],
        technologies: ['Stripe', 'Postgres'],
      },
    ],
    education: [
      {
        id: crypto.randomUUID(),
        type: 'education',
        visible: true,
        order: 0,
        createdAt: ts,
        updatedAt: ts,
        institution: 'University of Texas at Austin',
        degree: 'B.S.',
        fieldOfStudy: 'Business Administration',
        location: 'Austin, TX',
        startDate: '2014',
        endDate: '2018',
        grade: '3.7',
        description: [],
      },
    ],
    skills: [
      {
        id: crypto.randomUUID(),
        type: 'skills',
        visible: true,
        order: 0,
        createdAt: ts,
        updatedAt: ts,
        category: 'Product',
        skills: [
          { id: crypto.randomUUID(), name: 'Roadmapping', level: 5 },
          { id: crypto.randomUUID(), name: 'User Research', level: 4 },
          { id: crypto.randomUUID(), name: 'A/B Testing', level: 4 },
        ],
      },
      {
        id: crypto.randomUUID(),
        type: 'skills',
        visible: true,
        order: 1,
        createdAt: ts,
        updatedAt: ts,
        category: 'Tools',
        skills: [
          { id: crypto.randomUUID(), name: 'SQL', level: 3 },
          { id: crypto.randomUUID(), name: 'Figma', level: 3 },
          { id: crypto.randomUUID(), name: 'Amplitude', level: 4 },
        ],
      },
    ],
    projects: [
      {
        id: crypto.randomUUID(),
        type: 'projects',
        visible: true,
        order: 0,
        createdAt: ts,
        updatedAt: ts,
        title: 'Self-Serve Onboarding Redesign',
        description: 'Led discovery-to-launch of a guided onboarding flow that cut activation time by 4x.',
        technologies: ['Figma', 'Amplitude'],
        url: '',
        github: '',
        startDate: '2023',
        endDate: '2023',
      },
    ],
    certifications: [
      {
        id: crypto.randomUUID(),
        type: 'certifications',
        visible: true,
        order: 0,
        createdAt: ts,
        updatedAt: ts,
        title: 'Certified Scrum Product Owner',
        issuer: 'Scrum Alliance',
        issueDate: '2021',
        credentialId: '',
        credentialUrl: '',
      },
    ],
    customSections: [
      {
        id: crypto.randomUUID(),
        type: 'custom',
        visible: true,
        order: 0,
        createdAt: ts,
        updatedAt: ts,
        title: 'Languages',
        items: [
          { id: crypto.randomUUID(), title: 'English', subtitle: 'Native', description: '' },
          { id: crypto.randomUUID(), title: 'Spanish', subtitle: 'Professional working proficiency', description: '' },
        ],
      },
    ],
    sectionOrder: DEFAULT_SECTION_ORDER,
    settings: {
      pageSize: defaults?.pageSize ?? 'A4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      showProfileImage: false,
      showSectionIcons: false,
    },
    metadata: {
      wordCount: 0,
      pageCount: 1,
    },
  }
}

/**
 * Builds a new resume from best-effort parsed text (see resumeParser.ts).
 * Unlike createEmptyResume, unmatched fields are left blank rather than
 * filled with sample content — an imported resume shouldn't end up with
 * leftover fake data mixed in with whatever the user actually pasted.
 */
export function createResumeFromParsed(
  templateId: string,
  parsed: ParsedResumeData,
  defaults?: ResumeDefaults
): Resume {
  const ts = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    title: parsed.fullName ? `${parsed.fullName}'s Resume` : 'Untitled Resume',
    createdAt: ts,
    updatedAt: ts,
    templateId,
    themeId: defaults?.themeId ?? 'light',
    fontPresetId: defaults?.fontPresetId ?? 'professional',
    customPrimaryColor: defaults?.customPrimaryColor,
    personalInfo: {
      fullName: parsed.fullName ?? '',
      headline: '',
      email: parsed.email ?? '',
      phone: parsed.phone ?? '',
      location: '',
      website: parsed.website ?? '',
      linkedin: parsed.linkedin ?? '',
      github: parsed.github ?? '',
      portfolio: '',
    },
    summary: {
      id: crypto.randomUUID(),
      type: 'summary',
      visible: true,
      order: 0,
      createdAt: ts,
      updatedAt: ts,
      content: parsed.summary ?? '',
    },
    experience: (parsed.experience ?? []).map((entry, i) => ({
      id: crypto.randomUUID(),
      type: 'experience' as const,
      visible: true,
      order: i,
      createdAt: ts,
      updatedAt: ts,
      company: '',
      role: entry.role,
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: entry.description,
      technologies: [],
    })),
    education: (parsed.education ?? []).map((entry, i) => ({
      id: crypto.randomUUID(),
      type: 'education' as const,
      visible: true,
      order: i,
      createdAt: ts,
      updatedAt: ts,
      institution: entry.institution,
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      grade: '',
      description: entry.description,
    })),
    skills: parsed.skills?.length
      ? [{
          id: crypto.randomUUID(),
          type: 'skills' as const,
          visible: true,
          order: 0,
          createdAt: ts,
          updatedAt: ts,
          category: 'Skills',
          skills: parsed.skills.map((name) => ({ id: crypto.randomUUID(), name, level: 3 })),
        }]
      : [],
    projects: (parsed.projects ?? []).map((entry, i) => ({
      id: crypto.randomUUID(),
      type: 'projects' as const,
      visible: true,
      order: i,
      createdAt: ts,
      updatedAt: ts,
      title: entry.title,
      description: entry.description,
      technologies: [],
      url: '',
      github: '',
      startDate: '',
      endDate: '',
    })),
    certifications: (parsed.certifications ?? []).map((entry, i) => ({
      id: crypto.randomUUID(),
      type: 'certifications' as const,
      visible: true,
      order: i,
      createdAt: ts,
      updatedAt: ts,
      title: entry.title,
      issuer: '',
      issueDate: '',
      credentialId: '',
      credentialUrl: '',
    })),
    customSections: [],
    sectionOrder: DEFAULT_SECTION_ORDER,
    settings: {
      pageSize: defaults?.pageSize ?? 'A4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      showProfileImage: false,
      showSectionIcons: false,
    },
    metadata: {
      wordCount: 0,
      pageCount: 1,
    },
  }
}

export function toResumeListItem(resume: Resume): ResumeListItem {
  return {
    id: resume.id,
    title: resume.title,
    templateId: resume.templateId,
    themeId: resume.themeId,
    updatedAt: resume.updatedAt,
    createdAt: resume.createdAt,
    pageCount: resume.metadata.pageCount,
  }
}
