import { z } from 'zod'
import { db } from '@/shared/db/database'
import { resumeSchema } from '@/shared/schemas/resume.schema'
import { getTemplateById } from '@/features/templates/registry/template.registry'
import type { Resume } from '@/shared/types/resume.types'
import type { ImageAsset } from '@/shared/types/storage.types'

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024
const imageSchema = z.object({
  id: z.string().min(1),
  resumeId: z.string().min(1),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  base64: z
    .string()
    .min(4)
    .max(3 * 1024 * 1024)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
  width: z.number().int().min(1).max(4096),
  height: z.number().int().min(1).max(4096),
  createdAt: z.string().min(1),
})
const backupSchema = z.object({
  format: z.literal('resume-studio-backup'),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  resumes: z.array(resumeSchema).min(1).max(200),
  images: z.array(imageSchema).max(200),
})
export type ResumeBackup = z.infer<typeof backupSchema>

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return btoa(binary)
}

function imageBytes(image: ResumeBackup['images'][number]): Uint8Array {
  const bytes = Uint8Array.from(atob(image.base64), (char) => char.charCodeAt(0))
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const webp =
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  if (
    bytes.length > 2 * 1024 * 1024 ||
    !(image.mimeType === 'image/png' ? png : image.mimeType === 'image/jpeg' ? jpeg : webp)
  ) {
    throw new Error('The backup contains an invalid profile image.')
  }
  return bytes
}

export function parseBackup(text: string): ResumeBackup {
  if (new Blob([text]).size > MAX_BACKUP_BYTES)
    throw new Error('Choose a backup smaller than 20 MB.')
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('This file isn’t valid JSON. Choose a Resume Studio backup.')
  }
  const result = backupSchema.safeParse(json)
  if (!result.success)
    throw new Error(
      'This isn’t a supported Resume Studio backup. Export a new backup from Settings.'
    )
  const backup = result.data
  const ids = new Set(backup.resumes.map((resume) => resume.id))
  if (
    ids.size !== backup.resumes.length ||
    new Set(backup.images.map((image) => image.id)).size !== backup.images.length
  ) {
    throw new Error('The backup contains duplicate records. No resumes were restored.')
  }
  for (const resume of backup.resumes) {
    if (!getTemplateById(resume.templateId))
      throw new Error(`The template for “${resume.title}” isn’t available in this version.`)
    const imageId = resume.personalInfo.profileImage
    if (
      imageId &&
      !backup.images.some((image) => image.id === imageId && image.resumeId === resume.id)
    ) {
      throw new Error(`The profile image for “${resume.title}” is missing from the backup.`)
    }
  }
  for (const image of backup.images) {
    if (
      !backup.resumes.some(
        (resume) => resume.id === image.resumeId && resume.personalInfo.profileImage === image.id
      )
    ) {
      throw new Error('The backup contains an image without a matching resume.')
    }
    imageBytes(image)
  }
  return backup
}

export async function createBackup(): Promise<string> {
  const { resumes, images } = await db.transaction('r', db.resumes, db.images, async () => ({
    resumes: await db.resumes.toArray(),
    images: await db.images.toArray(),
  }))
  if (!resumes.length) throw new Error('Create a resume before downloading a backup.')
  const referenced = images.filter((image) =>
    resumes.some(
      (resume) => resume.id === image.resumeId && resume.personalInfo.profileImage === image.id
    )
  )
  const text = JSON.stringify({
    format: 'resume-studio-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    resumes,
    images: referenced.map(({ data, sizeBytes: _size, ...image }) => ({
      ...image,
      base64: toBase64(data),
    })),
  })
  parseBackup(text)
  return text
}

/** Restore as new copies in one transaction; existing resumes are never overwritten. */
export async function restoreBackup(backup: ResumeBackup): Promise<number> {
  const checked = parseBackup(JSON.stringify(backup))
  const now = new Date().toISOString()
  const resumeIds = new Map(checked.resumes.map((resume) => [resume.id, crypto.randomUUID()]))
  const imageIds = new Map(checked.images.map((image) => [image.id, crypto.randomUUID()]))
  const resumes: Resume[] = checked.resumes.map((resume) => ({
    ...resume,
    id: resumeIds.get(resume.id)!,
    title: `${resume.title} (Restored)`,
    updatedAt: now,
    personalInfo: {
      ...resume.personalInfo,
      profileImage: imageIds.get(resume.personalInfo.profileImage ?? ''),
    },
  }))
  const images: ImageAsset[] = checked.images.map((image) => {
    const data = imageBytes(image)
    return {
      id: imageIds.get(image.id)!,
      resumeId: resumeIds.get(image.resumeId)!,
      data,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      sizeBytes: data.length,
      createdAt: now,
    }
  })
  await db.transaction('rw', db.resumes, db.images, async () => {
    await db.resumes.bulkAdd(resumes)
    await db.images.bulkAdd(images)
  })
  return resumes.length
}

export function downloadBackup(text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `Resume-Studio-Backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
