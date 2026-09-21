import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('northstar', createTemplateRenderer({
  id: 'northstar',
  headingFamily: 'Manrope',
  bodyFamily: 'Inter',
  defaultScale: { name: 29, headline: 11.5, sectionTitle: 9.5, entryTitle: 10.5, body: 9.5, small: 8.5, caption: 8 },
  defaultLineHeight: { heading: 1.25, body: 1.5 },
  marginMm: 18,
  body: 'sidebar-left',
  sidebar: {
    widthPct: 0.31,
    tone: 'tint',
    sections: ['skills', 'education'],
  },
  header: 'stacked',
  sectionHeader: 'underline',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: { summary: 'About Me', experience: 'Experience' },
}))
