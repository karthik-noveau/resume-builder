import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('atlas', createTemplateRenderer({
  id: 'atlas',
  headingFamily: 'Manrope',
  bodyFamily: 'Inter',
  defaultScale: {
    name: 32,
    headline: 12,
    sectionTitle: 10,
    entryTitle: 11,
    body: 10,
    small: 9,
    caption: 8,
  },
  defaultLineHeight: { heading: 1.2, body: 1.45 },
  marginMm: 18,
  header: 'banner',
  sectionHeader: 'side-label',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: { summary: 'Executive Summary', experience: 'Experience' },
}))
