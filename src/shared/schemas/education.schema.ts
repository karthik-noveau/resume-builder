import { z } from 'zod'

export const educationSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('education'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  grade: z.string(),
  description: z.array(z.string()),
})

export type EducationSectionInput = z.infer<typeof educationSectionSchema>
