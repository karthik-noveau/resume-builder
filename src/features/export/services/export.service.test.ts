import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportService } from './export.service'
import { templateRenderer } from '@/features/templates/engine/template.renderer'
import type { Resume } from '@/shared/types/resume.types'

const generateBytes = vi.hoisted(() => vi.fn())

// Mocking dependencies
vi.mock('@/features/templates/engine/template.renderer', () => ({
  templateRenderer: {
    render: vi.fn().mockReturnValue({ pages: [] })
  },
  registerRenderer: vi.fn()
}))

vi.mock('./pdf.generator', () => {
  return {
    PdfGenerator: class {
      generate = generateBytes
    },
  }
})

vi.mock('@/shared/services/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/shared/stores/template.store', () => ({
  useTemplateStore: {
    getState: () => ({
      availableTemplates: [{ id: 'meridian' }]
    })
  }
}))

vi.mock('@/shared/stores/theme.store', () => ({
  useThemeStore: {
    getState: () => ({
      availableThemes: [{ id: 'light' }],
      availableFontPresets: [{ id: 'professional' }]
    })
  },
  resolveResumeTheme: (themeId: string) => ({ id: themeId, name: themeId, colors: {} })
}))

describe('ExportService', () => {
  const validResume: Resume = {
    id: '1',
    schemaVersion: 1,
    title: 'My Resume',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    templateId: 'meridian',
    themeId: 'light',
    fontPresetId: 'professional',
    personalInfo: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
      location: 'New York',
      headline: 'Software Engineer',
      website: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    summary: {
      id: 's1',
      type: 'summary',
      visible: true,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: 'A summary'
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    customSections: [],
    sectionOrder: ['summary'],
    settings: {
      pageSize: 'A4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      showProfileImage: false,
      showSectionIcons: false
    },
    metadata: {
      wordCount: 0,
      pageCount: 1
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    generateBytes.mockResolvedValue(new Uint8Array([1, 2, 3]))
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
    global.URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('successfully exports a valid resume', async () => {
    await expect(exportService.exportToPdf(validResume)).resolves.not.toThrow()
  })

  it.each([
    ['full name is missing', { fullName: '' }],
    ['email is missing', { email: '' }],
    ['email is unfinished', { email: 'john@' }],
  ])('previews and exports when %s', async (_description, patch) => {
    const draft = {
      ...validResume,
      personalInfo: { ...validResume.personalInfo, ...patch },
    }

    const pdf = await exportService.generatePdf(draft)
    expect(exportService.createPreviewUrl(pdf)).toBe('blob:url')
    expect(pdf.bytes).toEqual(new Uint8Array([1, 2, 3]))
    if (!draft.personalInfo.fullName) expect(pdf.fileName).toMatch(/^Resume_.*\.pdf$/)
    await expect(exportService.exportToPdf(draft)).resolves.toBeUndefined()
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
  })

  it('previews and exports an unfinished skill without changing the draft', async () => {
    const draft: Resume = {
      ...validResume,
      skills: [{
        id: 'skills-1', type: 'skills', visible: true, order: 1,
        createdAt: validResume.createdAt, updatedAt: validResume.updatedAt,
        category: '', skills: [{ id: 'skill-1', name: '' }],
      }],
      sectionOrder: ['summary', 'skills'],
    }
    const snapshot = structuredClone(draft)
    const pdf = await exportService.generatePdf(draft)
    expect(exportService.createPreviewUrl(pdf)).toBe('blob:url')
    await expect(exportService.exportToPdf(draft)).resolves.toBeUndefined()
    expect(templateRenderer.render).toHaveBeenCalledWith(draft, expect.anything(), expect.anything(), expect.anything())
    expect(draft).toEqual(snapshot)
  })

  it('still reports rendering failures', async () => {
    vi.mocked(templateRenderer.render).mockImplementationOnce(() => { throw new Error('PDF rendering failed') })
    await expect(exportService.generatePdf(validResume)).rejects.toThrow('PDF rendering failed')
  })
})
