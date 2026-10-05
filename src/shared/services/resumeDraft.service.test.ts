import { beforeEach, expect, it, vi } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { checkpointResumeDraft, clearResumeDraft, recoverResumeDraft } from './resumeDraft.service'
import { resumeService } from './resume.service'
import { storageService } from './storage.service'
import type { Resume } from '@/shared/types/resume.types'

beforeEach(() => sessionStorage.clear())

it('recovers a newer unfinished draft and removes it after a successful save', () => {
  const saved = createSampleResume('meridian')
  saved.updatedAt = '2026-01-01T00:00:00.000Z'
  const draft = { ...saved, updatedAt: '2026-01-01T00:00:01.000Z', personalInfo: { ...saved.personalInfo, email: 'unfinished@' } }
  checkpointResumeDraft(draft)
  expect(recoverResumeDraft(saved)?.personalInfo.email).toBe('unfinished@')
  clearResumeDraft(saved.id)
  expect(recoverResumeDraft(saved)).toBeUndefined()
})

it('does not overwrite a newer stored resume with a stale checkpoint', () => {
  const saved = createSampleResume('meridian')
  saved.updatedAt = '2026-01-01T00:00:02.000Z'
  checkpointResumeDraft({ ...saved, updatedAt: '2026-01-01T00:00:01.000Z' })
  expect(recoverResumeDraft(saved)).toBeUndefined()
  expect(sessionStorage.length).toBe(0)
})

it('recovers the latest edit even when an older write finishes after its checkpoint', async () => {
  const saved = createSampleResume('meridian')
  saved.updatedAt = '2026-01-01T00:00:00.000Z'
  let finishRead!: (resume: Resume) => void
  const read = vi.spyOn(storageService, 'getResume').mockImplementationOnce(() => new Promise(resolve => { finishRead = resolve }))
  const write = vi.spyOn(storageService, 'saveResume').mockResolvedValueOnce(undefined)
  vi.useFakeTimers()
  try {
    vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'))
    const pending = resumeService.updateResume(saved.id, { ...saved, title: 'Earlier edit' })
    const draft = { ...saved, title: 'Latest edit', updatedAt: '2026-01-01T00:00:02.000Z' }
    checkpointResumeDraft(draft)
    vi.setSystemTime(new Date('2026-01-01T00:00:03.000Z'))
    finishRead(saved)
    const persisted = await pending
    expect(recoverResumeDraft(persisted)?.title).toBe('Latest edit')
  } finally {
    vi.useRealTimers()
    read.mockRestore()
    write.mockRestore()
  }
})

it('keeps drafts for separate resumes independent', () => {
  const first = createSampleResume('meridian')
  const second = createSampleResume('meridian')
  checkpointResumeDraft(first)
  checkpointResumeDraft(second)
  clearResumeDraft(first.id)
  expect(recoverResumeDraft(second)?.id).toBe(second.id)
})

it.each(['{invalid json', '{"id":"broken"}'])('discards malformed recovery data: %s', raw => {
  const saved = createSampleResume('meridian')
  sessionStorage.setItem(`resume-studio:pending-draft:${saved.id}`, raw)
  expect(recoverResumeDraft(saved)).toBeUndefined()
  expect(sessionStorage.length).toBe(0)
})

it('does not use a checkpoint with a different resume id', () => {
  const saved = createSampleResume('meridian')
  sessionStorage.setItem(`resume-studio:pending-draft:${saved.id}`, JSON.stringify(createSampleResume('meridian')))
  expect(recoverResumeDraft(saved)).toBeUndefined()
})

it('does not crash saving when session storage is unavailable', () => {
  const saved = createSampleResume('meridian')
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
  expect(() => checkpointResumeDraft(saved)).not.toThrow()
  blocked.mockRestore()
})
