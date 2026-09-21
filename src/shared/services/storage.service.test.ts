import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Resume } from '@/shared/types/resume.types'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { storageService } from './storage.service'
import { resumeService } from './resume.service'

const records = vi.hoisted(() => new Map<string, Resume>())

vi.mock('@/shared/db/database', () => ({
  db: {
    resumes: {
      put: vi.fn((resume: Resume) => {
        records.set(resume.id, structuredClone(resume))
        return Promise.resolve(resume.id)
      }),
      get: vi.fn((id: string) => Promise.resolve(structuredClone(records.get(id)))),
      orderBy: () => ({
        reverse: () => ({
          toArray: () => Promise.resolve(structuredClone([...records.values()]).sort(
            (a, b) => b.updatedAt.localeCompare(a.updatedAt)
          )),
        }),
      }),
    },
  },
}))

beforeEach(() => {
  records.clear()
  vi.clearAllMocks()
})

describe('saved resume drafts', () => {
  it('loads the entire workspace and reopens a resume with an unfinished skill', async () => {
    const completed = createSampleResume('meridian')
    const draft = createSampleResume('experienced-icon-minimal')
    draft.skills[0].category = ''
    draft.skills[0].skills.push({ id: 'unfinished-skill', name: '', level: 3 })
    await storageService.saveResume(completed)
    await storageService.saveResume(draft)

    expect(await storageService.getResume(draft.id)).toEqual(draft)
    const workspace = await storageService.getAllResumesFull()
    expect(workspace).toHaveLength(2)
    expect(workspace).toEqual(expect.arrayContaining([completed, draft]))
    expect(records.get(draft.id)).toEqual(draft)

    // Autosave reads the previous draft before applying the next edit.
    const updated = await resumeService.updateResume(draft.id, { summary: {
      ...draft.summary, content: 'The next edit still saves.',
    } })
    expect((await storageService.getResume(draft.id))?.summary.content).toBe(updated.summary.content)
    expect(records.get(draft.id)?.skills).toEqual(draft.skills)
  })

  it('preserves partially entered contact details, links and headings', async () => {
    const draft = createSampleResume('meridian')
    draft.title = ''
    draft.personalInfo.fullName = ''
    draft.personalInfo.email = 'alex@'
    draft.personalInfo.website = 'https://'
    draft.personalInfo.linkedin = 'linkedin.com/in/'
    draft.personalInfo.github = 'github.com/'
    draft.personalInfo.portfolio = 'my portfolio'
    draft.projects[0].url = 'project.example'
    draft.projects[0].github = 'github.com/project'
    draft.certifications[0].credentialUrl = 'credential link'
    draft.summary.content = 'Draft text. '.repeat(300)
    draft.sectionTitles = { skills: '' }
    draft.customSections = [{
      id: 'custom-draft', type: 'custom', visible: true, order: 0,
      createdAt: draft.createdAt, updatedAt: draft.updatedAt, title: '', items: [],
    }]
    await storageService.saveResume(draft)
    expect(await storageService.getResume(draft.id)).toEqual(draft)
    expect(await storageService.getAllResumesFull()).toEqual([draft])
  })

  it('still rejects damaged record structure without deleting any saved data', async () => {
    const damaged = createSampleResume('meridian')
    const raw = { ...damaged, skills: 'not an array' } as unknown as Resume
    records.set(raw.id, raw)
    await expect(storageService.getResume(raw.id)).rejects.toThrow('schema validation')
    await expect(storageService.getAllResumesFull()).rejects.toThrow('Failed to get resume list')
    expect(records.get(raw.id)).toEqual(raw)
  })
})
