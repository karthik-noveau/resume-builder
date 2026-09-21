import type { IconName } from './layout.types'
import type { ResumeStyleOverrides } from './style.types'

// ─── Section Type Discriminant ───────────────────────────────────────────────

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'custom'

/** Built-in headings users can rename directly on the resume canvas. */
export type SectionTitleKey = Exclude<SectionType, 'custom'> | 'contact'

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
  /** Missing on older resumes: use the uploaded photo or the built-in avatar. */
  profileImageStyle?: 'avatar' | 'initials'
  /** Cartoon character preference only; not the person's gender. */
  profileAvatarVariant?: 'male' | 'female'
  profileImageBackground?: string
  showSectionIcons: boolean
  /** Optional for backward compatibility with resumes saved before design controls existed. */
  typographyScale?: 'small' | 'standard' | 'large'
  lineHeightDensity?: 'compact' | 'balanced' | 'relaxed'
  spacingDensity?: 'compact' | 'balanced' | 'spacious'
}

// ─── Resume Metadata ──────────────────────────────────────────────────────────

export interface ResumeMetadata {
  wordCount: number
  pageCount: number
  lastExportedAt?: string
  lastOpenedAt?: string
}

/** Semantic colors owned by a resume template. Missing values use the
 * template's carefully chosen default, which keeps old saved resumes valid. */
export interface TemplateColorOverrides {
  accent?: string
  sectionTitle?: string
  sectionDescription?: string
  sectionBorder?: string
  sectionIcon?: string
  sectionBackground?: string
  primaryText?: string
  secondaryText?: string
  mutedText?: string
  divider?: string
  softBackground?: string
  panelBackground?: string
  panelText?: string
  panelSecondaryText?: string
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
  /** Per-resume, semantic template color customizations. */
  templateColors?: TemplateColorOverrides
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
  /** Optional per-resume labels for built-in section headings. */
  sectionTitles?: Partial<Record<SectionTitleKey, string>>
  /**
   * Per-section icon overrides for templates that draw section-header icons.
   * Keyed by SectionType, or `custom:<id>` so each custom section can carry
   * its own. Absent means "use the template's default for that section".
   */
  sectionIcons?: Record<string, IconName>
  /**
   * Per-resume typography and colour overrides, at the text-style and the
   * individual-element level. See style.types.ts for the two tiers.
   */
  styleOverrides?: ResumeStyleOverrides
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
  customPrimaryColor?: string
  fontPresetId: string
  pageSize: 'A4' | 'LETTER'
  language: string
  createdAt: string
  updatedAt: string
}
