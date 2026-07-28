import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('atlas', createTemplateRenderer({
  id: 'atlas',
  accent: '#1d4ed8',
  headingFamily: 'Inter',
  bodyFamily: 'Inter',
  ink: '#111827',
  muted: '#4b5563',
  rule: '#e5e7eb',
  marginMm: 16,
  header: 'banner',
  sectionHeader: 'bar',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: { summary: 'Executive Summary', experience: 'Experience' },
}))
