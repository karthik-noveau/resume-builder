import { expect, it } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { createEmptyCustomSection } from '@/features/resume/utils/section.factory'
import { getTemplateById, templateRenderer } from '../../registry/template.registry'
import { AVAILABLE_THEMES, AVAILABLE_FONT_PRESETS } from '@/shared/stores/theme.store'
import type { LayoutNode } from '@/shared/types/layout.types'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'

loadTemplateFonts()
const flatten = (nodes: LayoutNode[]): LayoutNode[] => nodes.flatMap(node => [node, ...flatten(node.children)])
const render = (resume = createSampleResume('karthik')) => templateRenderer.render(
  resume, getTemplateById('karthik')!, AVAILABLE_THEMES[0], AVAILABLE_FONT_PRESETS[0],
)

it('groups editable contacts below the name with a portrait and light serif headings', () => {
  const tree = render()
  const nodes = flatten(tree.pages[0].nodes)
  const photo = nodes.find(node => node.type === 'image')!
  const name = nodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'fullName')!
  const email = nodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'email')!
  expect(photo.clipShape).toBe('circle')
  expect(photo.widthPt).toBeLessThanOrEqual(72)
  expect(photo.xPt + photo.widthPt).toBeLessThan(name.xPt)
  expect(name.content).toBe('ALEX MORGAN')
  expect(name.yPt + name.heightPt).toBeLessThan(email.yPt)
  expect(email.xPt).toBeGreaterThanOrEqual(name.xPt)
  expect(email.styles.textAlign).toBe('left')
  expect(email.styles.textDecoration).not.toBe('underline')
  const heading = nodes.find(node => node.editRef?.kind === 'section-title')!
  expect(heading.styles.fontFamily).toBe('SourceSerifPro')
  expect(heading.content).toBe('CAREER OBJECTIVE')
  expect(nodes.find(node => node.type === 'icon')?.styles.color).toBe('#255c7c')
  expect(tree.pages).toHaveLength(1)
})

it('renders project links, all contact fields and custom-section content without baking in personal data', () => {
  const resume = createSampleResume('karthik')
  resume.personalInfo.github = 'https://github.com/sample'
  resume.personalInfo.portfolio = 'https://portfolio.example.com'
  resume.projects[0].url = 'https://project.example.com'
  const custom = createEmptyCustomSection()
  custom.title = 'Achievements'
  custom.items = [{ id: 'award', title: 'Design award', subtitle: 'First place', description: 'Built an accessible prototype' }]
  resume.customSections = [custom]
  resume.sectionOrder = [...resume.sectionOrder, 'custom']
  const nodes = render(resume).pages.flatMap(page => flatten(page.nodes))
  const text = nodes.map(node => node.content).filter(Boolean).join(' ')
  for (const value of ['github.com/sample', 'portfolio.example.com', 'project.example.com', 'ACHIEVEMENTS', 'First place', 'Built an accessible prototype']) {
    expect(text).toContain(value)
  }
  expect(nodes.some(node => node.editRef?.kind === 'custom-section-title' && node.editRef.sectionId === custom.id)).toBe(true)
})

it('respects photo visibility and per-resume appearance overrides', () => {
  const resume = createSampleResume('karthik')
  resume.settings.showProfileImage = false
  resume.templateColors = { accent: '#804060', sectionTitle: '#223344' }
  resume.sectionTitles = { summary: 'Profile' }
  const nodes = render(resume).pages.flatMap(page => flatten(page.nodes))
  expect(nodes.some(node => node.type === 'image')).toBe(false)
  expect(nodes.find(node => node.type === 'icon')?.styles.color).toBe('#804060')
  expect(nodes.find(node => node.content === 'PROFILE')?.styles.color).toBe('#223344')
})
