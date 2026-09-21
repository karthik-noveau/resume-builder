import { describe, it, expect } from 'vitest'
import { ALL_TEMPLATES, templateRenderer } from '../registry/template.registry'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
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
      const resume = createSampleResume(tpl.id)
      const pages = templateRenderer.render(resume, tpl, theme, fp).pages
      const nodes = pages.flatMap((p) => p.nodes.flatMap((n) => flatten(n)))
      const text = allText(pages)
      const info = resume.personalInfo
      const usesIconContactRows = tpl.id === 'fresher-sidebar-photo'

      const editablePersonalField = (field: string) => nodes.find(
        (node) => node.editRef?.kind === 'personal-info' && node.editRef.field === field
      )

      // A resume missing any of these cannot actually be sent to an employer.
      it('includes the email address', () => {
        expect(text).toContain(info.email)
        if (!usesIconContactRows) expect(editablePersonalField('email')?.content).toBe(info.email)
      })

      it('includes the phone number', () => {
        expect(text).toContain(info.phone)
        if (!usesIconContactRows) expect(editablePersonalField('phone')?.content).toBe(info.phone)
      })

      it('includes the location', () => {
        expect(text).toContain(info.location)
        if (!usesIconContactRows) expect(editablePersonalField('location')?.content).toBe(info.location)
      })

      it('prints links without a scheme prefix', () => {
        expect(text).not.toMatch(/https?:\/\//)
      })

      it('prints at least one profile/portfolio link when one is set', () => {
        const anyLink = info.website || info.linkedin || info.github
        if (!anyLink) return
        expect(text).toContain(displayUrl(anyLink))
        const renderedLinkField = info.website ? 'website' : info.linkedin ? 'linkedin' : 'github'
        if (!usesIconContactRows) {
          expect(editablePersonalField(renderedLinkField)?.content).toBe(displayUrl(anyLink))
        }
      })

      if (usesIconContactRows) {
        it('keeps icon-paired contact rows out of inline editing', () => {
          for (const field of ['email', 'phone', 'location', 'website', 'linkedin', 'github']) {
            expect(editablePersonalField(field)).toBeUndefined()
          }
          const linkedValues = nodes.filter((node) => node.panelTarget === 'personal-info')
          expect(linkedValues.some((node) => node.content === info.email)).toBe(true)
          expect(linkedValues.some((node) => node.content === info.phone)).toBe(true)
          expect(linkedValues.some((node) => node.content === info.location)).toBe(true)
        })
      }
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
