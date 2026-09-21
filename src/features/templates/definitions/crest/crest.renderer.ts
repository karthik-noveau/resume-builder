import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'crest',
  createTemplateRenderer({
    id: 'crest',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 31,
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
      widthPct: 0.32,
      tone: 'dark',
      nameInPanel: true,
      photo: 'circle',
      sections: ['skills', 'certifications'],
    },
    header: 'stacked',
    sectionHeader: 'caps-rule',
    density: 'regular',
    uppercaseSectionTitles: true,
    titles: {
      summary: 'Executive Profile',
      experience: 'Professional Experience',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.5,
    },
  })
)
