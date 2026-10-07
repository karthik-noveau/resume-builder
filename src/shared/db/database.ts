import Dexie, { type EntityTable } from 'dexie'
import type { Resume, AppSettings } from '@/shared/types/resume.types'
import type { ImageAsset } from '@/shared/types/storage.types'
import type { TemplateDefinition } from '@/shared/types/template.types'

export interface ResumeVersion {
  id: string
  resumeId: string
  savedAt: string
  resume: Resume
}
export interface TrashedResume {
  id: string
  deletedAt: string
  resume: Resume
}

class ResumeStudioDB extends Dexie {
  resumes!: EntityTable<Resume, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  images!: EntityTable<ImageAsset, 'id'>
  templates!: EntityTable<TemplateDefinition, 'id'>
  versions!: EntityTable<ResumeVersion, 'id'>
  trash!: EntityTable<TrashedResume, 'id'>

  constructor() {
    super('ResumeStudioDB')

    this.version(1).stores({
      resumes: 'id, updatedAt, title',
      settings: 'id',
      images: 'id, resumeId',
      templates: 'id, category',
    })
    this.version(2).stores({
      versions: 'id, resumeId, savedAt',
      trash: 'id, deletedAt',
    })
  }
}

export const db = new ResumeStudioDB()
