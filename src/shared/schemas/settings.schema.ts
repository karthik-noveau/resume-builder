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
  profileImageStyle: z.enum(['avatar', 'initials']).optional(),
  profileAvatarVariant: z.enum(['male', 'female']).optional(),
  profileImageBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  showSectionIcons: z.boolean(),
  typographyScale: z.enum(['small', 'standard', 'large']).optional().default('standard'),
  lineHeightDensity: z.enum(['compact', 'balanced', 'relaxed']).optional().default('balanced'),
  spacingDensity: z.enum(['compact', 'balanced', 'spacious']).optional().default('balanced'),
})

export const appSettingsSchema = z.object({
  id: z.literal('global'),
  themeId: z.string().min(1),
  customPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontPresetId: z.string().min(1),
  pageSize: z.enum(['A4', 'LETTER']),
  language: z.string().min(2),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export type ResumeSettingsInput = z.infer<typeof resumeSettingsSchema>
export type AppSettingsInput = z.infer<typeof appSettingsSchema>
