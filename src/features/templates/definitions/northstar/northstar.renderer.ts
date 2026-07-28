import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('northstar', createTemplateRenderer({
  id: 'northstar',
  accent: '#0284c7',
  headingFamily: 'Manrope',
  bodyFamily: 'Manrope',
  ink: '#0f172a',
  muted: '#475569',
  rule: '#e2e8f0',
  marginMm: 16,
  body: 'sidebar-left',
  sidebar: {
    widthPct: 0.32,
    tone: 'tint',
    photo: 'circle',
    sections: ['skills', 'education'],
  },
  skills: 'meter',
  header: 'stacked',
  sectionHeader: 'bar',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: { summary: 'About Me', experience: 'Experience' },
}))
