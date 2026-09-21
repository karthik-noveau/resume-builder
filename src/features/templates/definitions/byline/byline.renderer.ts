import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'byline',
  createTemplateRenderer({
    id: 'byline',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 54,
      headline: 11,
      sectionTitle: 11,
      entryTitle: 10.5,
      body: 9.5,
      small: 8.5,
      caption: 8,
    },
    defaultLineHeight: { heading: 1.2, body: 1.4 },
    marginMm: 15,
    body: 'columns-right',
    header: 'stacked',
    sectionHeader: 'editorial-rule',
    density: 'compact',
    uppercaseSectionTitles: false,
    editorial: {
      family: 'split-editorial',
      photo: 'rounded',
      side: 'right',
      treatment: 'rule',
      panelWidth: 0.42,
      skillStyle: 'dots',
      stackedName: true,
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
