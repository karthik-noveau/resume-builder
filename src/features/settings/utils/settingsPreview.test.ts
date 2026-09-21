import { describe, expect, it } from 'vitest'
import { buildSettingsPreview } from './settingsPreview'
import type { LayoutNode } from '@/shared/types/layout.types'
import { appSettingsSchema } from '@/shared/schemas/settings.schema'

const defaults = { themeId: 'light', fontPresetId: 'professional', pageSize: 'A4' as const }
const flatten = (nodes: LayoutNode[]): LayoutNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children)])

describe('settings preview', () => {
  it('renders real resume text using the chosen font and accent', () => {
    const tree = buildSettingsPreview(
      { ...defaults, themeId: 'custom', customPrimaryColor: '#b84368', fontPresetId: 'executive' },
      'experienced-icon-minimal'
    )!
    const nodes = flatten(tree.pages.flatMap((page) => page.nodes))
    expect(nodes.some((node) => node.content === 'Alex Morgan')).toBe(true)
    expect(nodes.find((node) => node.content === 'Alex Morgan')?.styles.fontFamily).toBe(
      'SourceSerifPro'
    )
    expect(nodes.some((node) => node.styles.color === '#b84368')).toBe(true)
    const minimal = buildSettingsPreview(
      { ...defaults, fontPresetId: 'minimal' },
      'experienced-icon-minimal'
    )!
    expect(
      flatten(minimal.pages[0].nodes).find((node) => node.content === 'Alex Morgan')?.styles
        .fontFamily
    ).toBe('IBMPlexSans')
  })

  it('changes the actual page dimensions when switching to US Letter', () => {
    const a4 = buildSettingsPreview(defaults, 'meridian')!.pages[0]
    const letter = buildSettingsPreview({ ...defaults, pageSize: 'LETTER' }, 'meridian')!.pages[0]
    expect(a4.heightPt / a4.widthPt).toBeCloseTo(297 / 210, 2)
    expect(letter.widthPt).toBe(612)
    expect(letter.heightPt).toBe(792)
  })

  it('keeps a custom accent when saved settings are validated and accepts older settings', () => {
    const existing = {
      id: 'global',
      ...defaults,
      language: 'en',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }
    expect(appSettingsSchema.parse(existing).customPrimaryColor).toBeUndefined()
    expect(
      appSettingsSchema.parse({ ...existing, themeId: 'custom', customPrimaryColor: '#7a45d1' })
        .customPrimaryColor
    ).toBe('#7a45d1')
  })
})
