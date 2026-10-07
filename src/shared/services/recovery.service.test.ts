import 'fake-indexeddb/auto'
import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest'
import Dexie from 'dexie'
import { db } from '@/shared/db/database'
import { storageService } from './storage.service'
import { resumeService } from './resume.service'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { ResumeConflictError } from '@/shared/types/storage.types'

beforeEach(async () => {
  await db.resumes.clear()
  await db.images.clear()
  await db.versions.clear()
  await db.trash.clear()
})
afterAll(() => db.close())

describe('transactional saves and recovery', () => {
  it('upgrades an existing workspace without changing its saved resumes', async () => {
    const original = createSampleResume('meridian')
    await db.delete()
    const legacy = new Dexie('ResumeStudioDB')
    legacy
      .version(1)
      .stores({
        resumes: 'id, updatedAt, title',
        settings: 'id',
        images: 'id, resumeId',
        templates: 'id, category',
      })
    await legacy.table('resumes').put(original)
    legacy.close()
    await db.open()
    expect(await storageService.getResume(original.id)).toEqual(original)
    expect(await storageService.getVersions(original.id)).toEqual([])
    expect(await storageService.getTrash()).toEqual([])
    expect((await storageService.commitResume(original, 0)).revision).toBe(1)
  })

  it('rolls back both the resume and history when the new save fails', async () => {
    const original = createSampleResume('meridian')
    await storageService.saveResume(original)
    const write = vi
      .spyOn(db.resumes, 'put')
      .mockRejectedValueOnce(new DOMException('Full', 'QuotaExceededError'))
    try {
      await expect(
        storageService.commitResume({ ...original, title: 'Unsaved' }, 0)
      ).rejects.toThrow('Full')
      expect(await storageService.getResume(original.id)).toEqual(original)
      expect(await storageService.getVersions(original.id)).toEqual([])
    } finally {
      write.mockRestore()
    }
  })

  it('allows only one simultaneous save from the same revision, including legacy resumes', async () => {
    const original = createSampleResume('meridian')
    await storageService.saveResume(original)
    const results = await Promise.allSettled([
      storageService.commitResume({ ...original, title: 'First tab' }, 0),
      storageService.commitResume({ ...original, title: 'Second tab' }, 0),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    const saved = await storageService.getResume(original.id)
    expect(saved?.revision).toBe(1)
    expect((await storageService.getVersions(original.id))[0].resume).toEqual(original)
    await expect(storageService.commitResume(original, 0)).rejects.toBeInstanceOf(
      ResumeConflictError
    )
    expect(await storageService.getResume(original.id)).toEqual(saved)
  })

  it('keeps the last 30 versions and snapshots the current content before restoration', async () => {
    let resume = createSampleResume('meridian')
    await storageService.saveResume(resume)
    for (let i = 0; i < 34; i++) {
      resume = await storageService.commitResume(
        { ...resume, title: `Version ${i}`, updatedAt: new Date(100000 + i * 1000).toISOString() },
        resume.revision ?? 0
      )
    }
    const versions = await storageService.getVersions(resume.id)
    expect(versions).toHaveLength(30)
    const restored = await storageService.commitResume(
      { ...versions[5].resume, revision: resume.revision },
      resume.revision!
    )
    expect(restored.title).toBe(versions[5].resume.title)
    expect(
      (await storageService.getVersions(resume.id)).some((v) => v.resume.title === 'Version 33')
    ).toBe(true)
  })

  it('keeps photos and history in Trash, restores them, and cleans them only on permanent deletion', async () => {
    let resume = createSampleResume('fresher-sidebar-photo')
    resume.personalInfo.profileImage = 'portrait'
    await storageService.saveResume(resume)
    await storageService.saveImage({
      id: 'portrait',
      resumeId: resume.id,
      data: new Uint8Array([1]),
      sizeBytes: 1,
      width: 1,
      height: 1,
      mimeType: 'image/png',
      createdAt: resume.createdAt,
    })
    resume = await storageService.commitResume({ ...resume, title: 'Updated' }, 0)
    await storageService.deleteResume(resume.id)
    expect(await storageService.getResume(resume.id)).toBeUndefined()
    expect(await storageService.getTrash()).toHaveLength(1)
    expect(await storageService.getImage('portrait')).toBeDefined()
    await expect(storageService.commitResume(resume, resume.revision!)).rejects.toBeInstanceOf(
      ResumeConflictError
    )
    await storageService.restoreTrashedResume(resume.id)
    const restored = await storageService.getResume(resume.id)
    expect(restored?.personalInfo.profileImage).toBe('portrait')
    expect(restored?.revision).toBe(2)
    expect(await storageService.getVersions(resume.id)).toHaveLength(1)
    await expect(storageService.commitResume(resume, resume.revision!)).rejects.toBeInstanceOf(
      ResumeConflictError
    )
    await storageService.deleteResume(resume.id)
    await storageService.permanentlyDeleteResume(resume.id)
    expect(await storageService.getTrash()).toHaveLength(0)
    expect(await storageService.getImage('portrait')).toBeUndefined()
    expect(await storageService.getVersions(resume.id)).toHaveLength(0)
  })

  it('copies a conflicting draft and its photo without changing the newer saved resume', async () => {
    const original = createSampleResume('fresher-sidebar-photo')
    original.personalInfo.profileImage = 'photo'
    await storageService.saveResume(original)
    await storageService.saveImage({
      id: 'photo',
      resumeId: original.id,
      data: new Uint8Array([1]),
      sizeBytes: 1,
      width: 1,
      height: 1,
      mimeType: 'image/png',
      createdAt: original.createdAt,
    })
    await storageService.commitResume({ ...original, title: 'Saved in another tab' }, 0)
    const copy = await resumeService.copyDraft({ ...original, title: 'My unsaved draft' })
    expect(copy.title).toBe('My unsaved draft (Copy)')
    expect(copy.revision).toBe(0)
    expect(copy.personalInfo.profileImage).not.toBe('photo')
    expect((await storageService.getImage(copy.personalInfo.profileImage!))?.resumeId).toBe(copy.id)
    expect((await storageService.getResume(original.id))?.title).toBe('Saved in another tab')
  })
})
