import { describe, it, expect } from 'vitest'
import { parseResumeText } from './resumeParser'

describe('parseResumeText', () => {
  it('extracts name, email, phone, and links', () => {
    const raw = `Jane Doe
jane.doe@example.com | +1 (555) 987-6543
linkedin.com/in/janedoe | github.com/janedoe | janedoe.dev`

    const result = parseResumeText(raw)
    expect(result.fullName).toBe('Jane Doe')
    expect(result.email).toBe('jane.doe@example.com')
    expect(result.phone).toContain('555')
    expect(result.linkedin).toBe('https://linkedin.com/in/janedoe')
    expect(result.github).toBe('https://github.com/janedoe')
  })

  it('splits sections by recognized headers', () => {
    const raw = `Jane Doe

SUMMARY
Product manager with 5 years of experience.

EXPERIENCE
Senior PM at Acme Corp
Led a team of 5 engineers.
Shipped three major features.

SKILLS
SQL, Figma, Roadmapping`

    const result = parseResumeText(raw)
    expect(result.summary).toContain('Product manager')
    expect(result.experience?.[0]?.role).toBe('Senior PM at Acme Corp')
    expect(result.experience?.[0]?.description).toEqual([
      'Led a team of 5 engineers.',
      'Shipped three major features.',
    ])
    expect(result.skills).toEqual(['SQL', 'Figma', 'Roadmapping'])
  })

  it('leaves fields unset when there is no matching structure to find', () => {
    const result = parseResumeText('just some random unstructured text')
    expect(result.email).toBeUndefined()
    expect(result.phone).toBeUndefined()
    expect(result.experience).toBeUndefined()
    expect(result.skills).toBeUndefined()
  })

  it('never throws on empty input', () => {
    expect(() => parseResumeText('')).not.toThrow()
  })
})
