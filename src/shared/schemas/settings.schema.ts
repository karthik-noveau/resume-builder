import { z } from 'zod'

export const marginSettingsSchema = z.object({
  top: z.number().min(10).max(50),
  right: z.number().min(10).max(50),
  bottom: z.number().min(10).max(50),
  left: z.number().min(10).max(50),
})

export const resumeSettingsSchema = z.object({
  pageSize: z.enum(['A4', 'LETTER']),
  margins: marginSettingsSchema,
  showProfileImage: z.boolean(),
  showSectionIcons: z.boolean(),
})

export const appSettingsSchema = z.object({
  id: z.literal('global'),
  themeId: z.string().min(1),
  fontPresetId: z.string().min(1),
  pageSize: z.enum(['A4', 'LETTER']),
  language: z.string().min(2),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export type ResumeSettingsInput = z.infer<typeof resumeSettingsSchema>
export type AppSettingsInput = z.infer<typeof appSettingsSchema>
