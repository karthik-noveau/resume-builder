import { z } from 'zod'

const optionalUrl = z
  .string()
  .refine((val) => val === '' || z.string().url().safeParse(val).success, {
    message: 'Must be a valid URL or empty',
  })

export const certificationSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('certifications'),
  visible: z.boolean(),
  order: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  title: z.string(),
  issuer: z.string(),
  issueDate: z.string(),
  credentialId: z.string(),
  credentialUrl: optionalUrl,
})

export type CertificationSectionInput = z.infer<typeof certificationSectionSchema>
