import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'sterling',
  createTemplateRenderer({
    id: 'sterling',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 34,
      headline: 11.5,
      sectionTitle: 10.5,
      entryTitle: 11,
      body: 10,
      small: 9,
      caption: 8.5,
    },
    marginMm: 18,
    header: 'centered',
    sectionHeader: 'plain',
    density: 'roomy',
    titles: {
      summary: 'Professional Profile',
      experience: 'Professional Experience',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.45,
    },
  })
)
