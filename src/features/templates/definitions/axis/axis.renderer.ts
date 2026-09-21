import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'axis',
  createTemplateRenderer({
    id: 'axis',
    headingFamily: 'IBMPlexSans',
    bodyFamily: 'Inter',
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
    header: 'stacked',
    sectionHeader: 'icon',
    density: 'compact',
    timeline: true,
    uppercaseSectionTitles: true,
    titles: {
      summary: 'Profile',
      experience: 'Experience',
      skills: 'Skills & Tools',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.45,
    },
  })
)
