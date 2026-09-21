import type { TemplateColorKey } from '@/shared/utils/templateColors'

/**
 * One swatch per thing a person would name, rather than one per key the
 * templates happen to store.
 *
 * Several template colours are the same decision split three ways — an entry's
 * date, a section's description and a caption are all "supporting text" — so a
 * control writes every key it covers. That costs the small tonal hierarchy a
 * template ships between them; the text styles in the Design panel colour each
 * role separately for anyone who wants it back.
 */
export interface ColorControl {
  id: string
  label: string
  description: string
  /** Every key this control writes; the first one the template uses supplies
   * the swatch's current value. */
  keys: TemplateColorKey[]
}

export interface ColorGroup {
  id: string
  label: string
  controls: ColorControl[]
}

export const COLOR_GROUPS: ColorGroup[] = [
  {
    id: 'text',
    label: 'Text',
    controls: [
      { id: 'headings', label: 'Headings', description: 'Section titles and their icons', keys: ['sectionTitle', 'sectionIcon'] },
      { id: 'body', label: 'Body', description: 'Main copy, names and entry titles', keys: ['primaryText'] },
      { id: 'secondary', label: 'Secondary', description: 'Dates, captions and supporting copy', keys: ['secondaryText', 'mutedText', 'sectionDescription'] },
    ],
  },
  {
    id: 'accents',
    label: 'Accents & lines',
    controls: [
      { id: 'accent', label: 'Accent', description: 'Highlights and emphasis', keys: ['accent'] },
      { id: 'lines', label: 'Lines', description: 'Rules, dividers and heading borders', keys: ['divider', 'sectionBorder'] },
      { id: 'tint', label: 'Tinted blocks', description: 'Filled bands behind headings and blocks', keys: ['softBackground', 'sectionBackground'] },
    ],
  },
  {
    id: 'panel',
    label: 'Sidebar panel',
    controls: [
      { id: 'panelBackground', label: 'Background', description: 'The coloured sidebar or banner', keys: ['panelBackground'] },
      { id: 'panelText', label: 'Text', description: 'Text inside the coloured panel', keys: ['panelText', 'panelSecondaryText'] },
    ],
  },
]
