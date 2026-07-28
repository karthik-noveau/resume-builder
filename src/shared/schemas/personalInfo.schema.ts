import { z } from 'zod'

const optionalUrl = z
  .string()
  .refine((val) => val === '' || z.string().url().safeParse(val).success, {
    message: 'Must be a valid URL or empty',
  })

export const personalInfoSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  email: z.string().refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Must be a valid email address or empty',
  }),
  phone: z.string(),
  location: z.string(),
  website: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl,
  portfolio: optionalUrl,
  profileImage: z.string().optional(),
})

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
