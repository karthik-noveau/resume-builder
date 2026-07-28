import { z } from 'zod'

export const experienceSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('experience'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  company: z.string(),
  role: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  description: z.array(z.string()),
  technologies: z.array(z.string()),
})

export type ExperienceSectionInput = z.infer<typeof experienceSectionSchema>
