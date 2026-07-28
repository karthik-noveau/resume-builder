import { describe, it, expect } from 'vitest'
import { ALL_TEMPLATES, templateRenderer } from '../registry/template.registry'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'
import { AVAILABLE_THEMES, AVAILABLE_FONT_PRESETS } from '@/shared/stores/theme.store'
import { displayUrl } from './layout.utils'
import type { LayoutNode, LayoutPage } from '@/shared/types/layout.types'

const theme = AVAILABLE_THEMES.find((t) => t.id === 'light')!
const fp = AVAILABLE_FONT_PRESETS[0]

function flatten(n: LayoutNode, out: LayoutNode[] = []): LayoutNode[] {
  out.push(n)
  for (const c of n.children) flatten(c, out)
  return out
}

const allText = (pages: LayoutPage[]) =>
  pages
    .flatMap((p) => p.nodes.flatMap((n) => flatten(n)))
    .map((n) => n.content ?? '')
    .join(' ')

describe('every template renders usable contact details', () => {
  for (const tpl of ALL_TEMPLATES) {
    describe(tpl.name, () => {
      const resume = createEmptyResume(tpl.id)
      const text = allText(templateRenderer.render(resume, tpl, theme, fp).pages)
      const info = resume.personalInfo

      // A resume missing any of these cannot actually be sent to an employer.
      it('includes the email address', () => {
        expect(text).toContain(info.email)
      })

      it('includes the phone number', () => {
        expect(text).toContain(info.phone)
      })

      it('includes the location', () => {
        expect(text).toContain(info.location)
      })

      it('prints links without a scheme prefix', () => {
        expect(text).not.toMatch(/https?:\/\//)
      })

      it('prints at least one profile/portfolio link when one is set', () => {
        const anyLink = info.website || info.linkedin || info.github
        if (!anyLink) return
        expect(text).toContain(displayUrl(anyLink))
      })
    })
  }
})

describe('displayUrl', () => {
  it('strips scheme, www and trailing slash', () => {
    expect(displayUrl('https://www.example.com/')).toBe('example.com')
    expect(displayUrl('http://linkedin.com/in/alexmorgan')).toBe('linkedin.com/in/alexmorgan')
    expect(displayUrl('example.dev')).toBe('example.dev')
  })

  it('leaves an empty value alone', () => {
    expect(displayUrl('')).toBe('')
  })
})
