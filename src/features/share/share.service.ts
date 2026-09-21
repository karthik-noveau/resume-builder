import { z } from 'zod'
import { db } from '@/shared/db/database'
import { resumeSchema } from '@/shared/schemas/resume.schema'
import { getTemplateById } from '@/features/templates/registry/template.registry'
import { getBuiltinImageUrl } from '@/shared/utils/profileAvatar'
import type { Resume } from '@/shared/types/resume.types'
import type { ImageAsset } from '@/shared/types/storage.types'

export const MAX_SHARE_TOKEN_LENGTH = 256_000
export const MAX_SHARE_BYTES = 1024 * 1024
const INVALID_LINK = 'This share link is incomplete or invalid. Ask for a new link.'
const TOO_LARGE =
  'This resume is too large for a share link. Use a smaller profile photo or download a backup from Settings.'
const shareSchema = z.object({
  format: z.literal('resume-studio-share'),
  version: z.literal(1),
  resume: resumeSchema,
  image: z
    .object({
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
      width: z.number().int().min(1).max(4096),
      height: z.number().int().min(1).max(4096),
      base64: z
        .string()
        .min(4)
        .max(MAX_SHARE_BYTES)
        .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    })
    .optional(),
})
type SharedResume = z.infer<typeof shareSchema>

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(binary)
}

function fromBase64(text: string) {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0))
}

async function readLimited(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > limit) {
        await reader.cancel()
        throw new Error(TOO_LARGE)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function validatePayload(value: unknown): SharedResume {
  const parsed = shareSchema.safeParse(value)
  if (!parsed.success) throw new Error(INVALID_LINK)
  const payload = parsed.data
  if (!getTemplateById(payload.resume.templateId))
    throw new Error('This shared resume uses a template unavailable in this version.')
  const photo = payload.resume.personalInfo.profileImage
  if (Boolean(payload.image) !== Boolean(photo && !getBuiltinImageUrl(photo)))
    throw new Error('The profile photo is missing or invalid. Ask for a new share link.')
  if (payload.image) imageData(payload.image)
  return payload
}

function imageData(image: NonNullable<SharedResume['image']>) {
  const bytes = fromBase64(image.base64)
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const webp =
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  if (!(image.mimeType === 'image/png' ? png : image.mimeType === 'image/jpeg' ? jpeg : webp))
    throw new Error('The shared profile photo is invalid. Ask for a new share link.')
  return bytes
}

/** The fragment carries the complete snapshot; it is not part of the server request. */
export async function createShareLink(
  resume: Resume,
  origin = window.location.origin
): Promise<string> {
  if (typeof CompressionStream === 'undefined')
    throw new Error('Use a current browser to create a share link.')
  const snapshot = structuredClone(resume)
  const photo = snapshot.personalInfo.profileImage
  const asset = photo && !getBuiltinImageUrl(photo) ? await db.images.get(photo) : undefined
  if (photo && !getBuiltinImageUrl(photo) && !asset)
    throw new Error('Your profile photo could not be loaded. Upload it again before sharing.')
  const payload = validatePayload({
    format: 'resume-studio-share',
    version: 1,
    resume: snapshot,
    image: asset
      ? {
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
          base64: toBase64(asset.data),
        }
      : undefined,
  })
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  if (bytes.length > MAX_SHARE_BYTES) throw new Error(TOO_LARGE)
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
  const compressed = await readLimited(
    source.pipeThrough(new CompressionStream('gzip')),
    MAX_SHARE_TOKEN_LENGTH
  )
  const token = toBase64(compressed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  if (token.length > MAX_SHARE_TOKEN_LENGTH) throw new Error(TOO_LARGE)
  return `${new URL('/share', origin).href}#resume=v1.${token}`
}

export async function decodeShareLink(hash: string): Promise<SharedResume> {
  if (!hash.startsWith('#resume=v1.')) throw new Error(INVALID_LINK)
  const token = hash.slice('#resume=v1.'.length)
  if (!token || token.length > MAX_SHARE_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(token))
    throw new Error(INVALID_LINK)
  if (typeof DecompressionStream === 'undefined')
    throw new Error('Use a current browser to open this share link.')
  let value: unknown
  try {
    const compressed = fromBase64(token.replace(/-/g, '+').replace(/_/g, '/'))
    const source = new ReadableStream<BufferSource>({
      start(controller) {
        controller.enqueue(compressed)
        controller.close()
      },
    })
    const bytes = await readLimited(
      source.pipeThrough(new DecompressionStream('gzip')),
      MAX_SHARE_BYTES
    )
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new Error(INVALID_LINK)
  }
  return validatePayload(value)
}

/** Import atomically under fresh IDs, so a link cannot overwrite a local resume or photo. */
export async function importSharedResume(hash: string): Promise<string> {
  const payload = await decodeShareLink(hash)
  const now = new Date().toISOString()
  const resume: Resume = {
    ...payload.resume,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    metadata: { ...payload.resume.metadata, lastOpenedAt: now, lastExportedAt: undefined },
  }
  let image: ImageAsset | undefined
  if (payload.image) {
    const data = imageData(payload.image)
    image = {
      id: crypto.randomUUID(),
      resumeId: resume.id,
      data,
      mimeType: payload.image.mimeType,
      width: payload.image.width,
      height: payload.image.height,
      sizeBytes: data.length,
      createdAt: now,
    }
    resume.personalInfo = { ...resume.personalInfo, profileImage: image.id }
  }
  try {
    await db.transaction('rw', db.resumes, db.images, async () => {
      await db.resumes.add(resume)
      if (image) await db.images.add(image)
    })
  } catch {
    throw new Error('We couldn’t save this shared resume. Allow site storage, then try again.')
  }
  return resume.id
}
