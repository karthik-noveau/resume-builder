import { db } from '@/shared/db/database'
import { resumeSchema } from '@/shared/schemas/resume.schema'
import { appSettingsSchema } from '@/shared/schemas/settings.schema'
import type { Resume, AppSettings } from '@/shared/types/resume.types'
import type { ImageAsset } from '@/shared/types/storage.types'
import { StorageError, ValidationError } from '@/shared/types/storage.types'
import { logger } from './logger'

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  themeId: 'light',
  fontPresetId: 'professional',
  pageSize: 'A4',
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

class StorageServiceImpl {
  // ─── Resumes ───────────────────────────────────────────────────────────────

  async saveResume(resume: Resume): Promise<void> {
    try {
      await db.resumes.put(resume)
      logger.debug('Resume saved', { id: resume.id })
    } catch (err) {
      logger.error('Failed to save resume', err, { id: resume.id })
      throw new StorageError(`Failed to save resume ${resume.id}`, err)
    }
  }

  async getResume(id: string): Promise<Resume | undefined> {
    try {
      const raw = await db.resumes.get(id)
      if (!raw) return undefined

      const result = resumeSchema.safeParse(raw)
      if (!result.success) {
        const issues = result.error.issues
        logger.warn('Resume schema validation failed on read', { id, issues })
        throw new ValidationError(`Resume ${id} failed schema validation`, issues.map(i => i.message))
      }

      return result.data
    } catch (err) {
      if (err instanceof ValidationError) throw err
      logger.error('Failed to get resume', err, { id })
      throw new StorageError(`Failed to get resume ${id}`, err)
    }
  }

  async getAllResumesFull(): Promise<Resume[]> {
    try {
      const raw = await db.resumes.orderBy('updatedAt').reverse().toArray()
      const resumes: Resume[] = []
      for (const r of raw) {
        const result = resumeSchema.safeParse(r)
        if (!result.success) {
          logger.warn('Resume schema validation failed on read', { id: r.id, issues: result.error.issues })
          continue
        }
        resumes.push(result.data)
      }
      return resumes
    } catch (err) {
      logger.error('Failed to get all resumes', err)
      throw new StorageError('Failed to get resume list', err)
    }
  }

  async deleteResume(id: string): Promise<void> {
    try {
      await db.transaction('rw', db.resumes, db.images, async () => {
        await db.resumes.delete(id)
        await db.images.where('resumeId').equals(id).delete()
      })
      logger.debug('Resume deleted', { id })
    } catch (err) {
      logger.error('Failed to delete resume', err, { id })
      throw new StorageError(`Failed to delete resume ${id}`, err)
    }
  }

  // ─── Images ────────────────────────────────────────────────────────────────

  async saveImage(asset: ImageAsset): Promise<void> {
    try {
      await db.images.put(asset)
      logger.debug('Image saved', { id: asset.id, resumeId: asset.resumeId })
    } catch (err) {
      logger.error('Failed to save image', err, { id: asset.id })
      throw new StorageError(`Failed to save image ${asset.id}`, err)
    }
  }

  async getImage(id: string): Promise<ImageAsset | undefined> {
    try {
      return await db.images.get(id)
    } catch (err) {
      logger.error('Failed to get image', err, { id })
      throw new StorageError(`Failed to get image ${id}`, err)
    }
  }

  async deleteImage(id: string): Promise<void> {
    try {
      await db.images.delete(id)
    } catch (err) {
      logger.error('Failed to delete image', err, { id })
      throw new StorageError(`Failed to delete image ${id}`, err)
    }
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async getSettings(): Promise<AppSettings> {
    try {
      const raw = await db.settings.get('global')
      if (!raw) return DEFAULT_SETTINGS

      const result = appSettingsSchema.safeParse(raw)
      if (!result.success) {
        logger.warn('Settings validation failed, returning defaults')
        return DEFAULT_SETTINGS
      }

      return result.data
    } catch (err) {
      logger.error('Failed to get settings', err)
      return DEFAULT_SETTINGS
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await db.settings.put(settings)
    } catch (err) {
      logger.error('Failed to save settings', err)
      throw new StorageError('Failed to save settings', err)
    }
  }
}

export const storageService = new StorageServiceImpl()
