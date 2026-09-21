import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('canvas', createTemplateRenderer({
  id: 'canvas',
  headingFamily: 'SourceSerifPro',
  bodyFamily: 'Inter',
  defaultScale: { name: 32, headline: 11.5, sectionTitle: 10, entryTitle: 10.5, body: 9.5, small: 8.5, caption: 8 },
  defaultLineHeight: { heading: 1.2, body: 1.5 },
  marginMm: 18,
  body: 'sidebar-right',
  sidebar: {
    widthPct: 0.31,
    tone: 'tint',
    photo: 'circle',
    sections: ['education', 'skills'],
  },
  header: 'stacked',
  sectionHeader: 'plain',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: { summary: 'About Me', experience: 'Experience' },
}))
