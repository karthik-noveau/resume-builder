import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportService } from './export.service'
import type { Resume } from '@/shared/types/resume.types'

// Mocking dependencies
vi.mock('@/features/templates/engine/template.renderer', () => ({
  templateRenderer: {
    render: vi.fn().mockReturnValue({ pages: [] })
  },
  registerRenderer: vi.fn()
}))

vi.mock('./pdf.generator', () => {
  return {
    PdfGenerator: vi.fn().mockImplementation(() => ({
      generate: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }))
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
    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
    global.URL.revokeObjectURL = vi.fn()
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  it('successfully exports a valid resume', async () => {
    await expect(exportService.exportToPdf(validResume)).resolves.not.toThrow()
  })

  it('throws error if full name is missing', async () => {
    const invalidResume = {
      ...validResume,
      personalInfo: { ...validResume.personalInfo, fullName: '' }
    }
    await expect(exportService.exportToPdf(invalidResume)).rejects.toThrow('Full Name is required')
  })

  it('throws error if email is missing', async () => {
    const invalidResume = {
      ...validResume,
      personalInfo: { ...validResume.personalInfo, email: '' }
    }
    await expect(exportService.exportToPdf(invalidResume)).rejects.toThrow('Email is required')
  })
})
