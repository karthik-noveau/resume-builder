import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'juniper',
  createTemplateRenderer({
    id: 'juniper',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 30,
      headline: 11.5,
      sectionTitle: 9.5,
      entryTitle: 10.5,
      body: 9.5,
      small: 8.5,
      caption: 8,
    },
    marginMm: 18,
    body: 'sidebar-right',
    sidebar: {
      widthPct: 0.31,
      tone: 'tint',
      sections: ['skills', 'education', 'certifications'],
    },
    header: 'centered',
    sectionHeader: 'underline',
    density: 'regular',
    uppercaseSectionTitles: true,
    titles: {
      summary: 'Profile',
      experience: 'Experience',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.5,
    },
  })
)
