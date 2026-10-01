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
    expect(result.experience?.[0]?.role).toBe('Senior PM')
    expect(result.experience?.[0]?.company).toBe('Acme Corp')
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

it('separates dated jobs without blank lines and retains their achievements', () => {
  const parsed = parseResumeText(`Jordan Rivera
jordan@example.com
EXPERIENCE
Senior Engineer
Acme
Jan 2022 – Present
• Cut latency by 30%
Engineer
Beta Labs
Jun 2019 – Dec 2021
• Built payment APIs
EDUCATION
Example University
BSc Computer Science
2015 – 2019
Second University
MSc Computing
2020 – 2022`)
  expect(parsed.experience).toHaveLength(2)
  expect(parsed.experience?.[0]).toMatchObject({ role: 'Senior Engineer', company: 'Acme', current: true, startDate: 'Jan 2022', description: ['Cut latency by 30%'] })
  expect(parsed.experience?.[1]).toMatchObject({ company: 'Beta Labs', endDate: 'Dec 2021', description: ['Built payment APIs'] })
  expect(parsed.education).toHaveLength(2)
  expect(parsed.education?.[1]).toMatchObject({ institution: 'Second University', degree: 'MSc Computing', startDate: '2020' })
  expect(parsed.phone).toBeUndefined()
})

it('keeps separate paragraphs of achievements with the same job', () => {
  const parsed = parseResumeText(`Jordan Rivera\nEXPERIENCE\nEngineer at Acme\n\n• Built APIs\n\n• Reduced incidents\n\nDesigner at Beta\n• Improved onboarding`)
  expect(parsed.experience).toHaveLength(2)
  expect(parsed.experience?.[0].description).toEqual(['Built APIs', 'Reduced incidents'])
  expect(parsed.experience?.[1].company).toBe('Beta')
})
