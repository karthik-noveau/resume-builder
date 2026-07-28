import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('cadence', createTemplateRenderer({
  id: 'cadence',
  accent: '#2b3445',
  headingFamily: 'Inter',
  bodyFamily: 'Inter',
  ink: '#1f2937',
  muted: '#5b6472',
  rule: '#dfe3e8',
  band: '#f1f2f4',
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
