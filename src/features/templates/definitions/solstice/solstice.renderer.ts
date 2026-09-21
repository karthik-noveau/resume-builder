import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'solstice',
  createTemplateRenderer({
    id: 'solstice',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 32,
      headline: 11.5,
      sectionTitle: 9.5,
      entryTitle: 11,
      body: 10,
      small: 9,
      caption: 8,
    },
    marginMm: 18,
    header: 'centered',
    sectionHeader: 'boxed',
    density: 'compact',
    uppercaseSectionTitles: true,
    titles: {
      summary: 'About Me',
      experience: 'Experience',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.45,
    },
  })
)
