import Dexie, { type EntityTable } from 'dexie'
import type { Resume, AppSettings } from '@/shared/types/resume.types'
import type { ImageAsset } from '@/shared/types/storage.types'
import type { TemplateDefinition } from '@/shared/types/template.types'

class ResumeStudioDB extends Dexie {
  resumes!: EntityTable<Resume, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  images!: EntityTable<ImageAsset, 'id'>
  templates!: EntityTable<TemplateDefinition, 'id'>

  constructor() {
    super('ResumeStudioDB')

    this.version(1).stores({
      resumes: 'id, updatedAt, title',
      settings: 'id',
      images: 'id, resumeId',
      templates: 'id, category',
    })
  }
}

export const db = new ResumeStudioDB()
