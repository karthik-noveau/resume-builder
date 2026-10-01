/** Conservative local extraction. Unrecognized lines stay in entry descriptions for review. */
export interface ParsedExperience {
  role: string
  company?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description: string[]
}
export interface ParsedEducation {
  institution: string
  degree?: string
  startDate?: string
  endDate?: string
  description: string[]
}
export interface ParsedResumeData {
  fullName?: string
  email?: string
  phone?: string
  linkedin?: string
  github?: string
  website?: string
  summary?: string
  experience?: ParsedExperience[]
  education?: ParsedEducation[]
  skills?: string[]
  projects?: { title: string; description: string }[]
  certifications?: { title: string; description: string[] }[]
}

type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications'
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|]+/i
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|]+/i
const SECTION_HEADERS: { key: SectionKey; pattern: RegExp }[] = [
  {
    key: 'summary',
    pattern:
      /^(?:summary|professional summary|executive summary|profile|objective|about(?: me)?)\s*:?$/i,
  },
  {
    key: 'experience',
    pattern:
      /^(?:experience|work experience|employment(?: history)?|professional experience|career history)\s*:?$/i,
  },
  { key: 'education', pattern: /^education(?: & qualifications)?\s*:?$/i },
  { key: 'skills', pattern: /^(?:skills(?: & tools)?|technical skills|core competencies)\s*:?$/i },
  { key: 'projects', pattern: /^(?:projects?|selected projects)\s*:?$/i },
  { key: 'certifications', pattern: /^(?:certifications?|certificates|credentials)\s*:?$/i },
]
const DATE =
  '(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?\\s+)?(?:19|20)\\d{2}(?:[-/]\\d{2})?|\\d{1,2}/(?:19|20)\\d{2}'
const DATE_RANGE = new RegExp(
  `(${DATE})\\s*(?:[–—-]|\\bto\\b)\\s*(${DATE}|present|current|now)`,
  'i'
)
const BULLET = /^\s*[•●▪*–-]\s+/u
const clean = (line: string) => line.replace(BULLET, '').trim()
const looksLikeHeading = (line: string) =>
  !!line && line.length < 110 && !BULLET.test(line) && !/[.!?]$/.test(line)

function normalizeUrl(url: string): string {
  const value = url.replace(/[.,)\]]+$/, '')
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

/** Preserve paragraph boundaries and detect repeated date ranges even without blank lines. */
function splitEntries(lines: string[]): string[][] {
  const blocks: string[][] = []
  let block: string[] = []
  let gap = false
  for (const line of lines) {
    if (!line) {
      gap = true
      continue
    }
    if (gap && block.length > 1 && looksLikeHeading(line) && !DATE_RANGE.test(line)) {
      blocks.push(block)
      block = []
    }
    gap = false
    if (DATE_RANGE.test(line) && block.some((value) => DATE_RANGE.test(value))) {
      let boundary = block.length
      // A date usually follows a role and employer (or institution and degree).
      while (
        boundary > 0 &&
        block.length - boundary < 2 &&
        looksLikeHeading(block[boundary - 1]) &&
        !DATE_RANGE.test(block[boundary - 1])
      )
        boundary--
      blocks.push(block.slice(0, boundary))
      block = block.slice(boundary)
    }
    block.push(line)
  }
  if (block.length) blocks.push(block)
  return blocks.filter((entry) => entry.length)
}

function entryParts(lines: string[]) {
  const dated = lines.find((line) => DATE_RANGE.test(line))
  const date = dated?.match(DATE_RANGE)
  const content = lines
    .map((line) =>
      line
        .replace(DATE_RANGE, '')
        .replace(/^\s*[|,–—-]+|[|,–—-]+\s*$/g, '')
        .trim()
    )
    .filter(Boolean)
  return {
    content,
    startDate: date?.[1] ?? '',
    endDate: date && !/^(present|current|now)$/i.test(date[2]) ? date[2] : '',
    current: !!date && /^(present|current|now)$/i.test(date[2]),
  }
}

export function parseResumeText(raw: string): ParsedResumeData {
  const lines = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
  const result: ParsedResumeData = {}
  const sections: Partial<Record<SectionKey, string[]>> = {}
  const header: string[] = []
  let current: SectionKey | null = null
  for (const line of lines) {
    const section = SECTION_HEADERS.find(({ pattern }) => pattern.test(line))
    if (section) {
      current = section.key
      sections[current] ??= []
      continue
    }
    if (current) sections[current]!.push(line)
    else header.push(line)
  }
  const first = header.find(Boolean)
  if (
    first &&
    first.length < 60 &&
    !EMAIL_RE.test(first) &&
    !/^(resume|curriculum vitae|cv)$/i.test(first)
  )
    result.fullName = first
  const contact = header.join('\n')
  result.email = contact.match(EMAIL_RE)?.[0]
  result.phone = contact.match(PHONE_RE)?.[0].trim()
  const linkedin = contact.match(LINKEDIN_RE)?.[0]
  const github = contact.match(GITHUB_RE)?.[0]
  if (linkedin) result.linkedin = normalizeUrl(linkedin)
  if (github) result.github = normalizeUrl(github)
  const website = (contact.match(/https?:\/\/[^\s|]+/gi) ?? []).find(
    (url) => !/linkedin\.com|github\.com/i.test(url)
  )
  if (website) result.website = normalizeUrl(website)
  if (sections.summary) result.summary = sections.summary.filter(Boolean).join(' ')
  if (sections.skills)
    result.skills = sections.skills
      .filter(Boolean)
      .join(',')
      .split(/[,•·|;]/)
      .map(clean)
      .filter(Boolean)
  if (sections.experience)
    result.experience = splitEntries(sections.experience).map((lines) => {
      const { content, ...dates } = entryParts(lines)
      const parts = (content.shift() ?? '').split(/\s+(?:at|@)\s+|\s*\|\s*/i)
      const role = parts.shift() ?? ''
      let company = parts.join(' | ')
      if (!company && content[0] && looksLikeHeading(content[0])) company = content.shift()!
      return { role, company, ...dates, description: content.map(clean) }
    })
  if (sections.education)
    result.education = splitEntries(sections.education).map((lines) => {
      const { content, startDate, endDate } = entryParts(lines)
      const heading = content.shift() ?? ''
      const parts = heading.split(/\s*\|\s*/)
      const degreeFirst =
        /^(?:b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|bachelor|master|ph\.?d|mba|associate|diploma)\b/i.test(
          parts[0]
        )
      const next =
        parts[1] ?? (content[0] && looksLikeHeading(content[0]) ? content.shift() : '') ?? ''
      return {
        institution: degreeFirst ? next : parts[0],
        degree: degreeFirst ? parts[0] : next,
        startDate,
        endDate,
        description: content.map(clean),
      }
    })
  if (sections.projects)
    result.projects = splitEntries(sections.projects).map(([title, ...description]) => ({
      title,
      description: description.map(clean).join('\n'),
    }))
  if (sections.certifications)
    result.certifications = splitEntries(sections.certifications).map(
      ([title, ...description]) => ({ title, description: description.map(clean) })
    )
  return result
}
