import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('canvas', createTemplateRenderer({
  id: 'canvas',
  accent: '#b45309',
  headingFamily: 'Manrope',
  bodyFamily: 'Inter',
  ink: '#171717',
  muted: '#525252',
  rule: '#e5e5e5',
  marginMm: 18,
  footerContact: true,
  body: 'sidebar-right',
  sidebar: {
    widthPct: 0.33,
    tone: 'tint',
    nameInPanel: true,
    sections: ['education', 'skills'],
  },
  header: 'stacked',
  sectionHeader: 'plain',
  density: 'roomy',
  uppercaseSectionTitles: true,
  titles: { summary: 'About Me', experience: 'Experience' },
}))
