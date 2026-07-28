import { z } from 'zod'

export const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Skill name is required'),
  level: z.number().int().min(1).max(5).optional(),
})

export const skillSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('skills'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  category: z.string().min(1, 'Category name is required'),
  skills: z.array(skillSchema),
})

export type SkillSectionInput = z.infer<typeof skillSectionSchema>
