import { z } from 'zod'
import { personalInfoSchema } from './personalInfo.schema'
import { experienceSectionSchema } from './experience.schema'
import { educationSectionSchema } from './education.schema'
import { skillSchema, skillSectionSchema } from './skills.schema'
import { projectSectionSchema } from './projects.schema'
import { certificationSectionSchema } from './certifications.schema'
import { resumeSettingsSchema } from './settings.schema'
import { isSelectableIcon } from '@/features/templates/engine/icons'

// Saved resumes are drafts. Validate their structure without requiring finished
// content; the editor schemas still provide email, URL and required-field guidance.
// A blank skill or partially typed link must survive autosave, reload and backup.
const draftPersonalInfoSchema = personalInfoSchema.extend({
  email: z.string(),
  website: z.string(),
  linkedin: z.string(),
  github: z.string(),
  portfolio: z.string(),
})

const draftSkillSectionSchema = skillSectionSchema.extend({
  category: z.string(),
  skills: z.array(skillSchema.extend({ name: z.string() })),
})

const draftProjectSectionSchema = projectSectionSchema.extend({
  url: z.string(),
  github: z.string(),
})

const draftCertificationSectionSchema = certificationSectionSchema.extend({
  credentialUrl: z.string(),
})

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
  title: z.string(),
  items: z.array(genericListItemSchema),
})

const summarySectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('summary'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  content: z.string(),
})

const resumeMetadataSchema = z.object({
  wordCount: z.number().int().min(0),
  pageCount: z.number().int().min(1),
  lastExportedAt: z.string().optional(),
  lastOpenedAt: z.string().optional(),
})

/** A hex colour as the colour pickers emit it. */
const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)

/**
 * One style patch, at either tier. Bounds are the inspector's own limits:
 * anything outside them came from a hand-edited or corrupted record, and
 * letting it through would produce a resume that cannot be laid out.
 */
const elementStyleSchema = z.object({
  fontFamily: z.enum(['Inter', 'SourceSerifPro', 'Manrope', 'IBMPlexSans']).optional(),
  fontSize: z.number().min(4).max(96).optional(),
  fontWeight: z.union([
    z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800),
  ]).optional(),
  color: hexColor.optional(),
  backgroundColor: hexColor.optional(),
  lineHeight: z.number().min(0.6).max(4).optional(),
  letterSpacing: z.number().min(-0.2).max(1).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  textDecoration: z.enum(['none', 'underline']).optional(),
  paddingTopPt: z.number().min(0).max(120).optional(),
  paddingRightPt: z.number().min(0).max(120).optional(),
  paddingBottomPt: z.number().min(0).max(120).optional(),
  paddingLeftPt: z.number().min(0).max(120).optional(),
})

export const resumeSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(1),
  title: z.string(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  templateId: z.string().min(1),
  themeId: z.string().min(1),
  fontPresetId: z.string().min(1),
  customPrimaryColor: z.string().optional(),
  templateColors: z.object({
    accent: z.string().optional(),
    sectionTitle: z.string().optional(),
    sectionDescription: z.string().optional(),
    sectionBorder: z.string().optional(),
    sectionIcon: z.string().optional(),
    sectionBackground: z.string().optional(),
    primaryText: z.string().optional(),
    secondaryText: z.string().optional(),
    mutedText: z.string().optional(),
    divider: z.string().optional(),
    softBackground: z.string().optional(),
    panelBackground: z.string().optional(),
    panelText: z.string().optional(),
    panelSecondaryText: z.string().optional(),
  }).optional(),
  personalInfo: draftPersonalInfoSchema,
  summary: summarySectionSchema,
  experience: z.array(experienceSectionSchema),
  education: z.array(educationSectionSchema),
  skills: z.array(draftSkillSectionSchema),
  projects: z.array(draftProjectSectionSchema),
  certifications: z.array(draftCertificationSectionSchema),
  customSections: z.array(customSectionSchema),
  sectionOrder: z.array(sectionTypeSchema),
  sectionTitles: z.object({
    summary: z.string().optional(),
    experience: z.string().optional(),
    education: z.string().optional(),
    skills: z.string().optional(),
    projects: z.string().optional(),
    certifications: z.string().optional(),
    contact: z.string().optional(),
  }).optional(),
  // Keyed by SectionType or `custom:<id>`; values validated against the icon
  // library so a stale/unknown name can never reach the renderers.
  sectionIcons: z.record(z.string(), z.string().refine(isSelectableIcon)).optional(),
  styleOverrides: z.object({
    roles: z.record(z.string(), elementStyleSchema).optional(),
    elements: z.record(z.string(), elementStyleSchema).optional(),
    page: z.object({ backgroundColor: hexColor.optional() }).optional(),
  }).optional(),
  settings: resumeSettingsSchema,
  metadata: resumeMetadataSchema,
})

export type ResumeInput = z.infer<typeof resumeSchema>
