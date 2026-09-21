import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'vellum',
  createTemplateRenderer({
    id: 'vellum',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 30,
      headline: 11.5,
      sectionTitle: 10,
      entryTitle: 10.5,
      body: 9.5,
      small: 8.5,
      caption: 8,
    },
    marginMm: 18,
    body: 'sidebar-left',
    sidebar: {
      widthPct: 0.31,
      tone: 'tint',
      nameInPanel: true,
      sections: ['skills', 'certifications'],
    },
    header: 'stacked',
    sectionHeader: 'side-label',
    density: 'roomy',
    titles: {
      summary: 'Profile',
      experience: 'Experience',
      education: 'Education',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.5,
    },
  })
)
