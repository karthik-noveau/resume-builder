import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { createBackup, parseBackup, restoreBackup } from './backup.service'
import { db } from '@/shared/db/database'
import { resumeSchema } from '@/shared/schemas/resume.schema'

vi.mock('@/shared/db/database', () => ({
  db: {
    transaction: vi.fn((_mode, _resumes, _images, run: () => Promise<unknown>) => run()),
    resumes: { toArray: vi.fn(), bulkAdd: vi.fn().mockResolvedValue(undefined) },
    images: { toArray: vi.fn(), bulkAdd: vi.fn().mockResolvedValue(undefined) },
  },
}))

function fixture() {
  const resume = resumeSchema.parse(createSampleResume('meridian'))
  return {
    format: 'resume-studio-backup' as const,
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    resumes: [resume],
    images: [],
  }
}

beforeEach(() => vi.clearAllMocks())

describe('editable backups', () => {
  it('round-trips full content, hidden sections and styles', async () => {
    const backup = fixture()
    backup.resumes[0].experience[0].visible = false
    backup.resumes[0].styleOverrides = { roles: { name: { fontSize: 28 } } }
    vi.mocked(db.resumes.toArray).mockResolvedValue(backup.resumes)
    vi.mocked(db.images.toArray).mockResolvedValue([])
    const result = parseBackup(await createBackup())
    expect(result.resumes).toEqual(backup.resumes)
  })

  it('backs up and restores unfinished drafts without losing their content', async () => {
    const backup = fixture()
    const draft = backup.resumes[0]
    draft.skills[0].category = ''
    draft.skills[0].skills.push({ id: 'new-skill', name: '' })
    draft.personalInfo.email = 'alex@'
    draft.projects[0].url = 'https://'
    vi.mocked(db.resumes.toArray).mockResolvedValue(backup.resumes)
    vi.mocked(db.images.toArray).mockResolvedValue([])

    const parsed = parseBackup(await createBackup())
    expect(parsed.resumes).toEqual(backup.resumes)
    expect(await restoreBackup(parsed)).toBe(1)
    const restored = vi.mocked(db.resumes.bulkAdd).mock.calls[0][0][0]
    expect(restored.skills).toEqual(draft.skills)
    expect(restored.personalInfo.email).toBe('alex@')
    expect(restored.projects[0].url).toBe('https://')
  })

  it('restores new copies and rewrites image ownership together in one transaction', async () => {
    const backup = fixture()
    backup.resumes[0].personalInfo.profileImage = 'photo'
    const full = {
      ...backup,
      images: [
        {
          id: 'photo',
          resumeId: backup.resumes[0].id,
          mimeType: 'image/png' as const,
          base64: 'iVBORw0KGgo=',
          width: 1,
          height: 1,
          createdAt: backup.exportedAt,
        },
      ],
    }
    expect(await restoreBackup(full)).toBe(1)
    const saved = vi.mocked(db.resumes.bulkAdd).mock.calls[0][0][0]
    const image = vi.mocked(db.images.bulkAdd).mock.calls[0][0][0]
    expect(saved.id).not.toBe(backup.resumes[0].id)
    expect(saved.title).toBe(`${backup.resumes[0].title} (Restored)`)
    expect(saved.personalInfo.profileImage).toBe(image.id)
    expect(image.resumeId).toBe(saved.id)
    expect(image.data).toEqual(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))
    expect(db.transaction).toHaveBeenCalledWith('rw', db.resumes, db.images, expect.any(Function))
    expect(full.resumes[0].personalInfo.profileImage).toBe('photo')
  })

  it('rejects unsupported versions, duplicate IDs and unknown templates before writing', async () => {
    const backup = fixture()
    expect(() => parseBackup(JSON.stringify({ ...backup, version: 2 }))).toThrow(/supported/)
    expect(() =>
      parseBackup(JSON.stringify({ ...backup, resumes: [...backup.resumes, ...backup.resumes] }))
    ).toThrow(/duplicate/)
    backup.resumes[0].templateId = 'missing'
    await expect(restoreBackup(backup)).rejects.toThrow(/template/)
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('rejects missing photos instead of silently losing them', () => {
    const backup = fixture()
    backup.resumes[0].personalInfo.profileImage = 'missing'
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(/profile image/)
  })

  it('rejects a mismatched image payload', () => {
    const backup = fixture()
    backup.resumes[0].personalInfo.profileImage = 'photo'
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...backup,
          images: [
            {
              id: 'photo',
              resumeId: backup.resumes[0].id,
              mimeType: 'image/png',
              base64: btoa('<svg>script</svg>'),
              width: 1,
              height: 1,
              createdAt: backup.exportedAt,
            },
          ],
        })
      )
    ).toThrow(/invalid profile image/)
  })

  it('reports storage failure and does not claim successful restoration', async () => {
    vi.mocked(db.transaction).mockRejectedValueOnce(new Error('Quota exceeded'))
    await expect(restoreBackup(fixture())).rejects.toThrow('Quota exceeded')
  })

  it('rejects malformed and oversized files', () => {
    expect(() => parseBackup('{broken')).toThrow(/valid JSON/)
    expect(() => parseBackup(' '.repeat(21 * 1024 * 1024))).toThrow(/20 MB/)
  })
})
