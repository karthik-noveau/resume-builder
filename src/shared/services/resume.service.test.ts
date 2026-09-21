import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resumeService } from './resume.service'
import { storageService } from './storage.service'
import { createEmptyResume, createResumeFromParsed } from '@/features/resume/utils/resume.factory'
import type { Resume } from '@/shared/types/resume.types'

vi.mock('./storage.service', () => ({
  storageService: {
    saveResume: vi.fn().mockResolvedValue(undefined),
    getResume: vi.fn(),
    deleteResume: vi.fn().mockResolvedValue(undefined),
    getAllResumesFull: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({
      id: 'global', themeId: 'light', fontPresetId: 'professional', pageSize: 'A4', language: 'en', createdAt: '', updatedAt: '',
    }),
  }
}))

vi.mock('@/features/resume/utils/resume.factory', () => ({
  createEmptyResume: vi.fn().mockReturnValue({ id: 'new-id', title: 'New Resume' }),
  createResumeFromParsed: vi.fn().mockReturnValue({ id: 'import-id', title: 'Imported Resume' }),
}))

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}))

describe('ResumeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new resume using the saved app defaults', async () => {
    const resume = await resumeService.createResume('template-1')
    expect(createEmptyResume).toHaveBeenCalledWith('template-1', {
      themeId: 'light',
      fontPresetId: 'professional',
      pageSize: 'A4',
    })
    expect(storageService.saveResume).toHaveBeenCalledWith(resume)
    expect(resume.id).toBe('new-id')
  })

  it('carries the default accent into new and imported resumes', async () => {
    const settings = {
      ...await storageService.getSettings(),
      themeId: 'custom', customPrimaryColor: '#7a45d1', fontPresetId: 'minimal', pageSize: 'LETTER' as const,
    }
    vi.mocked(storageService.getSettings).mockResolvedValueOnce(settings).mockResolvedValueOnce(settings)
    await resumeService.createResume('template-1')
    await resumeService.createResumeFromImport('template-1', { fullName: 'Taylor Smith' })
    const appearance = { themeId: 'custom', customPrimaryColor: '#7a45d1', fontPresetId: 'minimal', pageSize: 'LETTER' }
    expect(createEmptyResume).toHaveBeenLastCalledWith('template-1', appearance)
    expect(createResumeFromParsed).toHaveBeenLastCalledWith('template-1', { fullName: 'Taylor Smith' }, appearance)
  })

  it('honors an explicit theme choice over the saved default accent', async () => {
    vi.mocked(storageService.getSettings).mockResolvedValueOnce({
      ...await storageService.getSettings(), themeId: 'custom', customPrimaryColor: '#7a45d1',
    })
    await resumeService.createResume('template-1', { themeId: 'light' })
    expect(createEmptyResume).toHaveBeenLastCalledWith('template-1', expect.objectContaining({ themeId: 'light', customPrimaryColor: undefined }))
  })

  it('duplicates an existing resume', async () => {
    const original = { id: 'orig', title: 'Original', metadata: {} }
    vi.mocked(storageService.getResume).mockResolvedValueOnce(original as unknown as Resume)

    const duplicate = await resumeService.duplicateResume('orig')
    expect(storageService.saveResume).toHaveBeenCalled()
    expect(duplicate.id).not.toBe('orig')
    expect(duplicate.title).toContain('(Copy)')
  })

  it('throws error when duplicating non-existent resume', async () => {
    vi.mocked(storageService.getResume).mockResolvedValueOnce(undefined)
    await expect(resumeService.duplicateResume('ghost')).rejects.toThrow('not found')
  })
})
