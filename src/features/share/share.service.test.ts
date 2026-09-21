// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gzipSync } from 'node:zlib'
import { db } from '@/shared/db/database'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { PROFILE_AVATAR_ID } from '@/shared/utils/profileAvatar'
import {
  createShareLink,
  decodeShareLink,
  importSharedResume,
  MAX_SHARE_BYTES,
  MAX_SHARE_TOKEN_LENGTH,
} from './share.service'

vi.mock('@/shared/db/database', () => ({
  db: {
    transaction: vi.fn((_mode, _resumes, _images, run: () => Promise<unknown>) => run()),
    resumes: { add: vi.fn().mockResolvedValue(undefined) },
    images: { get: vi.fn(), add: vi.fn().mockResolvedValue(undefined) },
  },
}))
const origin = 'https://resume.example'
const hashOf = (url: string) => new URL(url).hash
const pack = (value: unknown) =>
  `#resume=v1.${gzipSync(JSON.stringify(value)).toString('base64url')}`
beforeEach(() => vi.clearAllMocks())

describe('self-contained resume links', () => {
  it('round-trips Unicode, unfinished fields, hidden sections, custom design and template choices', async () => {
    const resume = createSampleResume('mosaic')
    resume.personalInfo.fullName = 'Zoë 李 — résumé 👩🏽‍💻'
    resume.personalInfo.email = 'unfinished@'
    resume.skills[0].skills.push({ id: 'draft-skill', name: '' })
    resume.experience[1].visible = false
    resume.templateColors = { accent: '#6942cc' }
    resume.styleOverrides = { roles: { body: { fontSize: 11 } } }
    const original = structuredClone(resume)
    const url = new URL(await createShareLink(resume, origin))
    expect(url.origin).toBe(origin)
    expect(url.pathname).toBe('/share')
    expect(url.search).toBe('')
    expect(url.hash).toMatch(/^#resume=v1\.[A-Za-z0-9_-]+$/)
    expect((await decodeShareLink(url.hash)).resume).toEqual(resume)
    expect(resume).toEqual(original)
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('imports an independent copy with new IDs and its own included photo in one transaction', async () => {
    const resume = createSampleResume('mosaic')
    resume.personalInfo.profileImage = 'original-photo'
    const data = new Uint8Array([255, 216, 255, 224, 0, 16])
    vi.mocked(db.images.get).mockResolvedValue({
      id: 'original-photo',
      resumeId: resume.id,
      data,
      mimeType: 'image/jpeg',
      width: 400,
      height: 300,
      sizeBytes: data.length,
      createdAt: resume.createdAt,
    })
    const hash = hashOf(await createShareLink(resume, origin))
    // The receiver has no access to the sender's IndexedDB.
    vi.mocked(db.images.get).mockResolvedValue(undefined)
    const id = await importSharedResume(hash)
    const saved = vi.mocked(db.resumes.add).mock.calls[0][0]
    const image = vi.mocked(db.images.add).mock.calls[0][0]
    expect(id).not.toBe(resume.id)
    expect(saved.id).toBe(id)
    expect(saved.title).toBe(resume.title)
    expect(saved.experience).toEqual(resume.experience)
    expect(saved.styleOverrides).toEqual(resume.styleOverrides)
    expect(saved.personalInfo.profileImage).toBe(image.id)
    expect(image.id).not.toBe('original-photo')
    expect(image.resumeId).toBe(id)
    expect(image.data).toEqual(data)
    expect(db.transaction).toHaveBeenCalledWith('rw', db.resumes, db.images, expect.any(Function))
    expect(resume.personalInfo.profileImage).toBe('original-photo')
  })

  it('retains built-in avatars without needing a database image', async () => {
    const resume = createSampleResume('mosaic')
    resume.personalInfo.profileImage = PROFILE_AVATAR_ID
    await importSharedResume(hashOf(await createShareLink(resume, origin)))
    expect(vi.mocked(db.resumes.add).mock.calls[0][0].personalInfo.profileImage).toBe(
      PROFILE_AVATAR_ID
    )
    expect(db.images.get).not.toHaveBeenCalled()
    expect(db.images.add).not.toHaveBeenCalled()
  })

  it.each([
    '',
    '#resume=',
    '#resume=v2.abc',
    '#resume=v1.%%%',
    ' #resume=v1.abc',
    '#resume=v1.abc',
  ])('rejects malformed links before storing anything: %s', async (hash) => {
    await expect(importSharedResume(hash)).rejects.toThrow(/link/)
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('rejects truncated, oversized, decompression-bomb and malformed schema payloads', async () => {
    const link = hashOf(await createShareLink(createSampleResume('meridian'), origin))
    await expect(importSharedResume(link.slice(0, -20))).rejects.toThrow(/link/)
    await expect(
      importSharedResume(`#resume=v1.${'A'.repeat(MAX_SHARE_TOKEN_LENGTH + 1)}`)
    ).rejects.toThrow(/link/)
    await expect(importSharedResume(pack('a'.repeat(MAX_SHARE_BYTES + 1)))).rejects.toThrow(/link/)
    await expect(
      importSharedResume(pack({ format: 'resume-studio-share', version: 1, resume: {} }))
    ).rejects.toThrow(/link/)
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('rejects unsupported templates and missing or non-image photo payloads', async () => {
    const resume = createSampleResume('missing-template')
    await expect(createShareLink(resume, origin)).rejects.toThrow(/template/)
    resume.templateId = 'mosaic'
    resume.personalInfo.profileImage = 'missing-image'
    await expect(createShareLink(resume, origin)).rejects.toThrow(/photo/)
    await expect(
      importSharedResume(pack({ format: 'resume-studio-share', version: 1, resume }))
    ).rejects.toThrow(/photo/)
    await expect(
      importSharedResume(
        pack({
          format: 'resume-studio-share',
          version: 1,
          resume,
          image: { mimeType: 'image/png', width: 1, height: 1, base64: btoa('<svg>script</svg>') },
        })
      )
    ).rejects.toThrow(/photo/)
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('reports storage failure without returning a successful imported ID', async () => {
    const hash = hashOf(await createShareLink(createSampleResume('mosaic'), origin))
    vi.mocked(db.transaction).mockRejectedValueOnce(new Error('Quota exceeded'))
    await expect(importSharedResume(hash)).rejects.toThrow(/site storage/)
  })

  it('enforces a generation limit without silently dropping resume content', async () => {
    const resume = createSampleResume('mosaic')
    resume.summary.content = 'a'.repeat(MAX_SHARE_BYTES + 1)
    await expect(createShareLink(resume, origin)).rejects.toThrow(/too large/)
  })
})
