import type { IconName } from './layout.types'

// ─── Section Type Discriminant ───────────────────────────────────────────────

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'custom'

// ─── Base Contract ────────────────────────────────────────────────────────────

export interface BaseSectionContract {
  id: string
  type: SectionType
  visible: boolean
  /** Ordering of entries within a section (e.g. job 1 before job 2). */
  order: number
  createdAt: string
  updatedAt: string
}

// ─── Personal Information ─────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  github: string
  portfolio: string
  /** ID reference to ImageAsset stored in IndexedDB. Not a data URL. */
  profileImage?: string
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface SummarySection extends BaseSectionContract {
  type: 'summary'
  content: string
}

// ─── Experience ───────────────────────────────────────────────────────────────

export interface ExperienceSection extends BaseSectionContract {
  type: 'experience'
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string[]
  technologies: string[]
}

// ─── Education ────────────────────────────────────────────────────────────────

export interface EducationSection extends BaseSectionContract {
  type: 'education'
  institution: string
  degree: string
  fieldOfStudy: string
  location: string
  startDate: string
  endDate: string
  grade: string
  description: string[]
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export interface Skill {
  id: string
  name: string
  level?: number
}

export interface SkillSection extends BaseSectionContract {
  type: 'skills'
  category: string
  skills: Skill[]
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface ProjectSection extends BaseSectionContract {
  type: 'projects'
  title: string
  description: string
  technologies: string[]
  url: string
  github: string
  startDate: string
  endDate: string
}

// ─── Certifications ───────────────────────────────────────────────────────────

export interface CertificationSection extends BaseSectionContract {
  type: 'certifications'
  title: string
  issuer: string
  issueDate: string
  credentialId: string
  credentialUrl: string
}

// ─── Generic List Item ────────────────────────────────────────────────────────

export interface GenericListItem {
  id: string
  title: string
  subtitle: string
  description: string
  startDate?: string
  endDate?: string
  url?: string
}

// ─── Custom Section ───────────────────────────────────────────────────────────

export interface CustomSection extends BaseSectionContract {
  type: 'custom'
  title: string
  items: GenericListItem[]
}

// ─── Resume Settings ──────────────────────────────────────────────────────────

export interface MarginSettings {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ResumeSettings {
  pageSize: 'A4' | 'LETTER'
  margins: MarginSettings
  showProfileImage: boolean
  showSectionIcons: boolean
}

// ─── Resume Metadata ──────────────────────────────────────────────────────────

export interface ResumeMetadata {
  wordCount: number
  pageCount: number
  lastExportedAt?: string
  lastOpenedAt?: string
}

// ─── Root Resume ──────────────────────────────────────────────────────────────

export interface Resume {
  id: string
  schemaVersion: 1
  title: string
  createdAt: string
  updatedAt: string
  templateId: string
  themeId: string
  fontPresetId: string
  /** Hex accent color used when themeId === 'custom'. */
  customPrimaryColor?: string
  personalInfo: PersonalInfo
  summary: SummarySection
  experience: ExperienceSection[]
  education: EducationSection[]
  skills: SkillSection[]
  projects: ProjectSection[]
  certifications: CertificationSection[]
  customSections: CustomSection[]
  /** User-defined ordering of section blocks in the canvas. */
  sectionOrder: SectionType[]
  /**
   * Per-section icon overrides for templates that draw section-header icons.
   * Keyed by SectionType, or `custom:<id>` so each custom section can carry
   * its own. Absent means "use the template's default for that section".
   */
  sectionIcons?: Record<string, IconName>
  settings: ResumeSettings
  metadata: ResumeMetadata
}

// ─── Derived Types ────────────────────────────────────────────────────────────

/** Lightweight projection used by Dashboard cards. */
export interface ResumeListItem {
  id: string
  title: string
  templateId: string
  themeId: string
  updatedAt: string
  createdAt: string
  pageCount: number
}

/** Deep-frozen snapshot of Resume used for undo/redo. */
export type ResumeSnapshot = Readonly<Resume>

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  /** Singleton record — always 'global'. */
  id: 'global'
  themeId: string
  fontPresetId: string
  pageSize: 'A4' | 'LETTER'
  language: string
  createdAt: string
  updatedAt: string
}
