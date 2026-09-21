import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'studio',
  createTemplateRenderer({
    id: 'studio',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 29,
      headline: 11,
      sectionTitle: 9.5,
      entryTitle: 10.5,
      body: 9.5,
      small: 8.5,
      caption: 8,
    },
    marginMm: 18,
    body: 'sidebar-right',
    sidebar: {
      widthPct: 0.3,
      tone: 'tint',
      sections: ['skills', 'education', 'certifications'],
    },
    header: 'monogram',
    sectionHeader: 'side-label',
    density: 'regular',
    uppercaseSectionTitles: true,
    titles: {
      summary: 'Creative Profile',
      experience: 'Experience',
      projects: 'Selected Projects',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.5,
    },
  })
)
