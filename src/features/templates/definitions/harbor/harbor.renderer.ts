import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'harbor',
  createTemplateRenderer({
    id: 'harbor',
    headingFamily: 'IBMPlexSans',
    bodyFamily: 'IBMPlexSans',
    defaultScale: {
      name: 31,
      headline: 11.5,
      sectionTitle: 10,
      entryTitle: 11,
      body: 10,
      small: 9,
      caption: 8,
    },
    marginMm: 18,
    header: 'split',
    sectionHeader: 'underline',
    density: 'compact',
    uppercaseSectionTitles: true,
    titles: {
      summary: 'Profile',
      skills: 'Technical Skills',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.45,
    },
  })
)
