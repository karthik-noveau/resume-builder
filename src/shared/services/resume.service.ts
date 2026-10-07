import type { Resume } from '@/shared/types/resume.types'
import type { DeepPartial } from '@/shared/types/utils.types'
import { ResumeConflictError, StorageError } from '@/shared/types/storage.types'
import { getBuiltinImageUrl } from '@/shared/utils/profileAvatar'
import { storageService } from './storage.service'
import { createEmptyResume, createResumeFromParsed } from '@/features/resume/utils/resume.factory'
import type { ParsedResumeData } from '@/features/resume/utils/resumeParser'
import { logger } from './logger'

class ResumeServiceImpl {
  async createResume(
    templateId: string,
    themeOverride?: { themeId: string; customPrimaryColor?: string }
  ): Promise<Resume> {
    const settings = await storageService.getSettings()
    const resume = createEmptyResume(templateId, {
      themeId: themeOverride?.themeId ?? settings.themeId,
      fontPresetId: settings.fontPresetId,
      pageSize: settings.pageSize,
      customPrimaryColor: themeOverride ? themeOverride.customPrimaryColor : settings.customPrimaryColor,
    })
    await storageService.saveResume(resume)
    logger.info('Resume created', { id: resume.id, templateId })
    return resume
  }

  async createResumeFromImport(templateId: string, parsed: ParsedResumeData): Promise<Resume> {
    const settings = await storageService.getSettings()
    const resume = createResumeFromParsed(templateId, parsed, {
      themeId: settings.themeId,
      customPrimaryColor: settings.customPrimaryColor,
      fontPresetId: settings.fontPresetId,
      pageSize: settings.pageSize,
    })
    await storageService.saveResume(resume)
    logger.info('Resume created from import', { id: resume.id, templateId })
    return resume
  }

  async duplicateResume(id: string): Promise<Resume> {
    const original = await storageService.getResume(id)
    if (!original) {
      throw new StorageError(`Cannot duplicate: resume ${id} not found`)
    }

    return this.copyDraft(original)
  }

  async copyDraft(original: Resume): Promise<Resume> {
    const ts = new Date().toISOString()
    const duplicate: Resume = {
      ...structuredClone(original),
      id: crypto.randomUUID(),
      revision: 0,
      title: `${original.title} (Copy)`,
      createdAt: ts,
      updatedAt: ts,
      metadata: { ...original.metadata, lastExportedAt: undefined },
    }

    // The profile image must be copied too, not just referenced. Image rows are
    // owned by a resumeId and deleteResume cascades on it, so a duplicate that
    // shared the original's asset would silently lose its photo the moment the
    // original was deleted.
    const sourceImageId = original.personalInfo?.profileImage
    if (sourceImageId && !getBuiltinImageUrl(sourceImageId)) {
      const asset = await storageService.getImage(sourceImageId)
      if (asset) {
        const copy = {
          ...structuredClone(asset),
          id: crypto.randomUUID(),
          resumeId: duplicate.id,
          createdAt: ts,
        }
        await storageService.saveImage(copy)
        duplicate.personalInfo.profileImage = copy.id
      } else {
        // Dangling reference on the original — don't carry it into the copy.
        duplicate.personalInfo.profileImage = undefined
      }
    }

    await storageService.saveResume(duplicate)
    logger.info('Resume duplicated', { originalId: original.id, newId: duplicate.id })
    return duplicate
  }

  async updateResume(id: string, patch: DeepPartial<Resume>): Promise<Resume> {
    // Keep the edit's timestamp: a slow write must not make an older snapshot
    // appear newer than a recovery draft created while that write was pending.
    const updatedAt = patch.updatedAt ?? new Date().toISOString()
    const existing = await storageService.getResume(id)
    if (!existing) {
      throw new ResumeConflictError()
    }

    // Cast is safe: existing is a validated Resume; patch only adds/changes values.
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      schemaVersion: 1 as const,
      updatedAt,
    } as Resume

    return storageService.commitResume(updated, patch.revision ?? existing.revision ?? 0)
  }

  async deleteResume(id: string): Promise<void> {
    await storageService.deleteResume(id)
    logger.info('Resume deleted', { id })
  }

  async getResumeList(): Promise<Resume[]> {
    return storageService.getAllResumesFull()
  }

  async getResume(id: string): Promise<Resume | undefined> {
    return storageService.getResume(id)
  }
}

export const resumeService = new ResumeServiceImpl()
