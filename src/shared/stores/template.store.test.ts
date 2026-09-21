import { describe, it, expect, beforeEach } from 'vitest'
import { useTemplateStore } from './template.store'
import type { TemplateDefinition } from '@/shared/types/template.types'

const mockTemplate: TemplateDefinition = {
  id: 'ats-01',
  name: 'ATS Clean',
  layout: 'single-column' as const,
  category: 'Experienced',
  designStyle: 'Simple',
  version: 1,
  description: 'Clean ATS-friendly template',
  thumbnail: '/thumbnails/ats-01-light.svg',
  tags: ['ats', 'clean'],
  exportRules: {
    includeProfileImage: false,
    forceBlackText: true,
  },
}

const mockTemplate2 = { ...mockTemplate, id: 'modern-01', name: 'Modern', category: 'Fresher' as const }

function resetStore() {
  useTemplateStore.setState({
    activeTemplateId: 'ats-01',
    availableTemplates: [],
    isLoading: false,
  })
}

describe('templateStore', () => {
  beforeEach(resetStore)

  it('loads templates', () => {
    useTemplateStore.getState().loadTemplates([mockTemplate, mockTemplate2])
    expect(useTemplateStore.getState().availableTemplates).toHaveLength(2)
  })

  it('switches to a valid template', () => {
    useTemplateStore.getState().loadTemplates([mockTemplate, mockTemplate2])
    useTemplateStore.getState().switchTemplate('modern-01')
    expect(useTemplateStore.getState().activeTemplateId).toBe('modern-01')
  })

  it('ignores switch to unknown template', () => {
    useTemplateStore.getState().loadTemplates([mockTemplate])
    useTemplateStore.getState().switchTemplate('nonexistent')
    expect(useTemplateStore.getState().activeTemplateId).toBe('ats-01')
  })

  it('getActiveTemplate returns the active template', () => {
    useTemplateStore.getState().loadTemplates([mockTemplate, mockTemplate2])
    const t = useTemplateStore.getState().getActiveTemplate()
    expect(t?.id).toBe('ats-01')
  })

  it('getActiveTemplate returns undefined when templates not loaded', () => {
    const t = useTemplateStore.getState().getActiveTemplate()
    expect(t).toBeUndefined()
  })
})
