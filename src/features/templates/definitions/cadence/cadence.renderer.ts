import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('cadence', createTemplateRenderer({
  id: 'cadence',
  headingFamily: 'Inter',
  bodyFamily: 'Inter',
  marginMm: 15,
  header: 'band-photo',
  body: 'sidebar-left',
  sidebar: {
    widthPct: 0.33,
    tone: 'tint',
    sections: ['skills', 'certifications', 'education'],
  },
  timeline: true,
  sectionHeader: 'icon',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: {
    summary: 'Profile',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    certifications: 'Certifications',
  },
}))
