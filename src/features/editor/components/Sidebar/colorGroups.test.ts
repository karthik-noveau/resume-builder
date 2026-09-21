import { describe, it, expect } from 'vitest'
import { COLOR_GROUPS } from './colorGroups'
import { TEMPLATE_COLOR_FIELDS, type TemplateColorKey } from '@/shared/utils/templateColors'

const controlled = COLOR_GROUPS.flatMap((group) => group.controls.flatMap((control) => control.keys))

describe('resume colour groups', () => {
  /**
   * The grouping is a hand-written map from template colour keys to the eight
   * swatches a person sees. A key with no control is unreachable — the colour
   * silently becomes un-editable — so adding one to TemplateColorOverrides has
   * to come with a home here.
   */
  it('gives every template colour key a control', () => {
    const allKeys = Object.keys(TEMPLATE_COLOR_FIELDS) as TemplateColorKey[]
    const missing = allKeys.filter((key) => !controlled.includes(key))
    expect(missing).toEqual([])
  })

  it('never puts one key under two controls, which would make them fight', () => {
    const seen = new Set<TemplateColorKey>()
    const duplicates = controlled.filter((key) => {
      if (seen.has(key)) return true
      seen.add(key)
      return false
    })
    expect(duplicates).toEqual([])
  })

  it('keeps every visible label distinct within its group', () => {
    for (const group of COLOR_GROUPS) {
      const labels = group.controls.map((c) => c.label)
      expect(new Set(labels).size).toBe(labels.length)
    }
  })
})
