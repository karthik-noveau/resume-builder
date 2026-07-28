import { create } from 'zustand'
import type { TemplateDefinition } from '@/shared/types/template.types'
import { logger } from '@/shared/services/logger'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'

interface TemplateState {
  activeTemplateId: string
  availableTemplates: TemplateDefinition[]
  isLoading: boolean
}

interface TemplateActions {
  setActiveTemplateId(id: string): void
  loadTemplates(templates: TemplateDefinition[]): void
  switchTemplate(templateId: string): void
  getActiveTemplate(): TemplateDefinition | undefined
}

type TemplateStore = TemplateState & TemplateActions

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  activeTemplateId: 'meridian',
  availableTemplates: ALL_TEMPLATES,
  isLoading: false,

  // ─── Actions ────────────────────────────────────────────────────────────────
  setActiveTemplateId(id) {
    set({ activeTemplateId: id })
  },

  loadTemplates(templates) {
    set({ availableTemplates: templates })
    logger.debug('Templates loaded', { count: templates.length })
  },

  switchTemplate(templateId) {
    const exists = get().availableTemplates.some((t) => t.id === templateId)
    if (!exists) {
      logger.warn('Attempted to switch to unknown template', { templateId })
      return
    }

    set({ activeTemplateId: templateId })
    logger.info('Template switched', { templateId })
  },

  getActiveTemplate() {
    const { activeTemplateId, availableTemplates } = get()
    return availableTemplates.find((t) => t.id === activeTemplateId)
  },
}))
