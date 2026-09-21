import { describe, expect, it } from 'vitest'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { DEFAULT_TEMPLATE_FILTERS, filterTemplates, hasTemplateFilters } from './templateFilters'

describe('template collection filters', () => {
  it.each(['Simple', 'Ultra Modern'] as const)(
    'finds all twenty %s designs by search',
    (designStyle) => {
      const searched = filterTemplates(ALL_TEMPLATES, {
        ...DEFAULT_TEMPLATE_FILTERS,
        search: `  ${designStyle.toLowerCase()}  `,
      })
      expect(searched).toHaveLength(20)
      expect(searched.every((template) => template.designStyle === designStyle)).toBe(true)
      expect(hasTemplateFilters({ ...DEFAULT_TEMPLATE_FILTERS, search: designStyle })).toBe(true)
    }
  )

  it('combines layout and search', () => {
    expect(
      filterTemplates(ALL_TEMPLATES, {
        layout: 'two-column',
        search: 'Horizon',
      }).map((template) => template.id)
    ).toEqual(['horizon'])
    expect(
      filterTemplates(ALL_TEMPLATES, {
        layout: 'single-column',
        search: 'Horizon',
      })
    ).toEqual([])
  })

  it('ignores removed filter values left in an existing session', () => {
    const previousFilters = {
      ...DEFAULT_TEMPLATE_FILTERS,
      category: 'Fresher',
      designStyle: 'Simple',
    }
    expect(filterTemplates(ALL_TEMPLATES, previousFilters)).toHaveLength(40)
    expect(hasTemplateFilters(previousFilters)).toBe(false)
  })

  it('resets all facets to the full catalog', () => {
    expect(hasTemplateFilters(DEFAULT_TEMPLATE_FILTERS)).toBe(false)
    expect(filterTemplates(ALL_TEMPLATES, DEFAULT_TEMPLATE_FILTERS)).toHaveLength(40)
  })
})
