import { z } from 'zod'

const optionalUrl = z
  .string()
  .refine((val) => val === '' || z.string().url().safeParse(val).success, {
    message: 'Must be a valid URL or empty',
  })

export const projectSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('projects'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  title: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  url: optionalUrl,
  github: optionalUrl,
  startDate: z.string(),
  endDate: z.string(),
})

export type ProjectSectionInput = z.infer<typeof projectSectionSchema>
