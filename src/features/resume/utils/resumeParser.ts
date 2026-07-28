/**
 * Best-effort heuristic parser for pasted resume text. No AI/backend involved
 * — pure regex/heuristics, so accuracy is rough by design. It's meant to save
 * typing on a first pass, not to produce a precise import; the caller should
 * tell the user to review the result afterward.
 */

export interface ParsedResumeData {
  fullName?: string
  email?: string
  phone?: string
  linkedin?: string
  github?: string
  website?: string
  summary?: string
  experience?: { role: string; description: string[] }[]
  education?: { institution: string; description: string[] }[]
  skills?: string[]
  projects?: { title: string; description: string }[]
  certifications?: { title: string; description: string[] }[]
}

type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications'

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/\S+/i
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/\S+/i
const ANY_URL_RE = /https?:\/\/\S+/gi

const SECTION_HEADERS: { key: SectionKey; pattern: RegExp }[] = [
  { key: 'summary', pattern: /^(summary|profile|objective|about)\b/i },
  { key: 'experience', pattern: /^(experience|work experience|employment( history)?|professional experience)\b/i },
  { key: 'education', pattern: /^education\b/i },
  { key: 'skills', pattern: /^(skills|technical skills|core competencies)\b/i },
  { key: 'projects', pattern: /^projects?\b/i },
  { key: 'certifications', pattern: /^certifications?\b/i },
]

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,)\]]+$/, '')
}

function normalizeUrl(url: string): string {
  const clean = stripTrailingPunctuation(url)
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
}

/** Splits raw lines into per-section blocks based on recognized header lines. */
function splitIntoSections(lines: string[]): Partial<Record<SectionKey, string[]>> {
  const sections: Partial<Record<SectionKey, string[]>> = {}
  let current: SectionKey | null = null

  for (const line of lines) {
    if (!line) continue
    // Only treat short lines as headers — a matching keyword mid-paragraph shouldn't split.
    const header = line.length < 40 ? SECTION_HEADERS.find((h) => h.pattern.test(line)) : undefined
    if (header) {
      current = header.key
      sections[current] = sections[current] ?? []
      continue
    }
    if (current) {
      sections[current] = sections[current] ?? []
      sections[current]!.push(line)
    }
  }
  return sections
}

function extractSkillNames(lines: string[]): string[] {
  return lines
    .join(', ')
    .split(/[,•·|]/)
    .map((s) => s.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

export function parseResumeText(raw: string): ParsedResumeData {
  const lines = raw.split(/\r?\n/).map((l) => l.trim())
  const nonEmptyLines = lines.filter(Boolean)
  const result: ParsedResumeData = {}

  const first = nonEmptyLines[0]
  if (first && first.length < 60 && !EMAIL_RE.test(first) && !SECTION_HEADERS.some((h) => h.pattern.test(first))) {
    result.fullName = first
  }

  const emailMatch = raw.match(EMAIL_RE)
  if (emailMatch) result.email = emailMatch[0]

  const linkedinMatch = raw.match(LINKEDIN_RE)
  if (linkedinMatch) result.linkedin = normalizeUrl(linkedinMatch[0])

  const githubMatch = raw.match(GITHUB_RE)
  if (githubMatch) result.github = normalizeUrl(githubMatch[0])

  const urlMatches = raw.match(ANY_URL_RE) ?? []
  const website = urlMatches.find((u) => !/linkedin\.com|github\.com/i.test(u))
  if (website) result.website = normalizeUrl(website)

  const phoneMatch = raw.match(PHONE_RE)
  if (phoneMatch) result.phone = phoneMatch[0].trim()

  const sections = splitIntoSections(lines)

  if (sections.summary?.length) {
    result.summary = sections.summary.join(' ').trim()
  }
  if (sections.skills?.length) {
    result.skills = extractSkillNames(sections.skills)
  }
  // One best-effort entry per section — free text isn't reliably splittable
  // into multiple jobs/degrees without real NLP, so we don't pretend to.
  if (sections.experience?.length) {
    result.experience = [{ role: sections.experience[0], description: sections.experience.slice(1) }]
  }
  if (sections.education?.length) {
    result.education = [{ institution: sections.education[0], description: sections.education.slice(1) }]
  }
  if (sections.projects?.length) {
    result.projects = [{ title: sections.projects[0], description: sections.projects.slice(1).join(' ') }]
  }
  if (sections.certifications?.length) {
    result.certifications = [{ title: sections.certifications[0], description: sections.certifications.slice(1) }]
  }

  return result
}
