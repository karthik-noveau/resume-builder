import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resumeService } from './resume.service'
import { storageService } from './storage.service'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'
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
  createEmptyResume: vi.fn().mockReturnValue({ id: 'new-id', title: 'New Resume' })
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
