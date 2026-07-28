import { z } from 'zod'
import { personalInfoSchema } from './personalInfo.schema'
import { experienceSectionSchema } from './experience.schema'
import { educationSectionSchema } from './education.schema'
import { skillSectionSchema } from './skills.schema'
import { projectSectionSchema } from './projects.schema'
import { certificationSectionSchema } from './certifications.schema'
import { resumeSettingsSchema } from './settings.schema'
import { isSelectableIcon } from '@/features/templates/engine/icons'

const sectionTypeSchema = z.enum([
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'custom',
])

const genericListItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  url: z.string().optional(),
})

const customSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('custom'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  title: z.string().min(1),
  items: z.array(genericListItemSchema),
})

const summarySectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('summary'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  content: z.string().max(3000),
})

const resumeMetadataSchema = z.object({
  wordCount: z.number().int().min(0),
  pageCount: z.number().int().min(1),
  lastExportedAt: z.string().optional(),
  lastOpenedAt: z.string().optional(),
})

export const resumeSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(1),
  title: z.string().min(1, 'Resume title is required'),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  templateId: z.string().min(1),
  themeId: z.string().min(1),
  fontPresetId: z.string().min(1),
  customPrimaryColor: z.string().optional(),
  personalInfo: personalInfoSchema,
  summary: summarySectionSchema,
  experience: z.array(experienceSectionSchema),
  education: z.array(educationSectionSchema),
  skills: z.array(skillSectionSchema),
  projects: z.array(projectSectionSchema),
  certifications: z.array(certificationSectionSchema),
  customSections: z.array(customSectionSchema),
  sectionOrder: z.array(sectionTypeSchema),
  // Keyed by SectionType or `custom:<id>`; values validated against the icon
  // library so a stale/unknown name can never reach the renderers.
  sectionIcons: z.record(z.string(), z.string().refine(isSelectableIcon)).optional(),
  settings: resumeSettingsSchema,
  metadata: resumeMetadataSchema,
})

export type ResumeInput = z.infer<typeof resumeSchema>
