import type { TemplateDefinition } from '@/shared/types/template.types'

export interface TemplateFilterValues {
  layout: TemplateDefinition['layout'] | 'All'
  search: string
}

export const DEFAULT_TEMPLATE_FILTERS: TemplateFilterValues = {
  layout: 'All',
  search: '',
}

export function filterTemplates(templates: TemplateDefinition[], filters: TemplateFilterValues) {
  const query = filters.search.trim().toLowerCase()
  return templates.filter(
    (template) =>
      (filters.layout === 'All' || template.layout === filters.layout) &&
      (template.name.toLowerCase().includes(query) ||
        template.designStyle.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query)))
  )
}

export function hasTemplateFilters(filters: TemplateFilterValues) {
  return filters.layout !== 'All' || filters.search !== ''
}
