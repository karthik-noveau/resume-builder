import { describe, it, expect } from 'vitest'
import {
  ICON_PATHS,
  ICON_LIBRARY,
  SELECTABLE_ICONS,
  CONTACT_ICONS,
  isSelectableIcon,
  sectionIconKey,
  resolveSectionIcon,
} from './icons'
import { ALL_TEMPLATES, getTemplateById } from '../registry/template.registry'
import type { Resume } from '@/shared/types/resume.types'

describe('icon library', () => {
  it('has path data for every icon the picker offers', () => {
    const missing = SELECTABLE_ICONS.filter((n) => !ICON_PATHS[n])
    expect(missing).toEqual([])
  })

  it('has path data for the contact icons too', () => {
    const missing = CONTACT_ICONS.filter((n) => !ICON_PATHS[n])
    expect(missing).toEqual([])
  })

  it('never offers a contact glyph as a section icon', () => {
    const leaked = SELECTABLE_ICONS.filter((n) => (CONTACT_ICONS as string[]).includes(n))
    expect(leaked).toEqual([])
  })

  it('lists each icon in exactly one group', () => {
    const all = ICON_LIBRARY.flatMap((g) => g.icons)
    expect(all.length).toBe(new Set(all).size)
  })

  it('accepts known names and rejects unknown ones', () => {
    expect(isSelectableIcon('rocket')).toBe(true)
    expect(isSelectableIcon('phone')).toBe(false) // contact-only
    expect(isSelectableIcon('not-a-real-icon')).toBe(false)
  })

  it('offers at least 50 section icons', () => {
    expect(SELECTABLE_ICONS.length).toBeGreaterThanOrEqual(50)
  })

  it('opens every path with a moveto', () => {
    const bad = Object.entries(ICON_PATHS).filter(([, d]) => !/^[Mm]\s*-?[\d.]/.test(d.trim()))
    expect(bad.map(([n]) => n)).toEqual([])
  })

  it('re-anchors interior subpaths that open relatively', () => {
    // Several library glyphs are a flattened stack of separate SVG elements,
    // each authored from the origin. A relative `m` starting an interior
    // subpath would instead be offset by wherever the previous one ended, so it
    // is only legal directly after an explicit M0,0. (A *leading* relative `m`
    // is fine — the initial current point is already the origin.)
    const unanchored = (d: string) => /(?<!M0,0 )\bm\s*-?[\d.]/.test(d.replace(/^\s*m/, 'M'))

    // negative control: the detector fires on the mistake it exists to catch
    expect(unanchored('M4,4 L8,8 m2 2 l1 1')).toBe(true)
    expect(unanchored('M4,4 L8,8 M0,0 m2 2 l1 1')).toBe(false)

    const offenders = Object.entries(ICON_PATHS).filter(([, d]) => unanchored(d))
    expect(offenders.map(([n]) => n)).toEqual([])
  })
})

describe('sectionIconKey', () => {
  it('keys standard sections by type', () => {
    expect(sectionIconKey('experience')).toBe('experience')
  })

  it('keys custom sections individually so each can differ', () => {
    expect(sectionIconKey('custom', 'abc')).toBe('custom:abc')
    expect(sectionIconKey('custom', 'abc')).not.toBe(sectionIconKey('custom', 'xyz'))
  })
})

describe('resolveSectionIcon', () => {
  const withIcons = (sectionIcons?: Record<string, never>) =>
    ({ sectionIcons } as unknown as Pick<Resume, 'sectionIcons'>)

  it('falls back to the template default when nothing is set', () => {
    expect(resolveSectionIcon(withIcons(), 'experience', 'briefcase')).toBe('briefcase')
  })

  it('prefers the user override', () => {
    const r = { sectionIcons: { experience: 'rocket' } } as unknown as Pick<Resume, 'sectionIcons'>
    expect(resolveSectionIcon(r, 'experience', 'briefcase')).toBe('rocket')
  })

  it('ignores an override that is not a real icon', () => {
    const r = { sectionIcons: { experience: 'bogus' } } as unknown as Pick<Resume, 'sectionIcons'>
    expect(resolveSectionIcon(r, 'experience', 'briefcase')).toBe('briefcase')
  })

  it('scopes custom-section overrides to their own id', () => {
    const r = { sectionIcons: { 'custom:a': 'music' } } as unknown as Pick<Resume, 'sectionIcons'>
    expect(resolveSectionIcon(r, 'custom', 'heart', 'a')).toBe('music')
    expect(resolveSectionIcon(r, 'custom', 'heart', 'b')).toBe('heart')
  })
})

describe('template section-icon defaults', () => {
  it('only names icons that exist in the library', () => {
    const bad: string[] = []
    for (const tpl of ALL_TEMPLATES) {
      for (const [section, icon] of Object.entries(tpl.sectionIcons ?? {})) {
        if (!ICON_PATHS[icon]) bad.push(`${tpl.name}.${section}=${icon}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('keeps icon-enabled legacy templates valid for saved resumes', () => {
    expect(getTemplateById('cadence')?.sectionIcons).toBeDefined()
  })

  it('keeps title icons editable in the visible Clarity template', () => {
    expect(ALL_TEMPLATES.find((template) => template.id === 'experienced-icon-minimal')?.sectionIcons).toBeDefined()
  })
})
