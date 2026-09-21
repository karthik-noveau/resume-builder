import type { Resume, SectionTitleKey, SectionType } from '@/shared/types/resume.types'
import type { LayoutTree } from '@/shared/types/layout.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import { inspectAtsLayout } from './layoutChecks'

export type AtsCategory = 'Parsing & layout' | 'Contact' | 'Career history' | 'Writing' | 'Skills'
export type AtsDestination = SectionType | 'personal' | 'design'
export type AtsFix =
  | 'single-column'
  | 'hide-photo'
  | 'headings'
  | 'deduplicate-skills'
  | 'clean-bullets'
  | 'sort-experience'
  | 'readable-text'
  | 'page-bounds'
export interface AtsCheck {
  id: string
  label: string
  category: AtsCategory
  points: number
  max: number
  status: 'passed' | 'review'
  priority: 'high' | 'medium' | 'low'
  evidence: string[]
  advice: string
  destination: AtsDestination
  fix?: AtsFix
}
export interface AtsReport {
  score: number
  checks: AtsCheck[]
  categories: { label: AtsCategory; score: number; max: number }[]
  wordCount: number
  pageCount: number | null
}

export const STANDARD_HEADINGS: Record<SectionTitleKey, string> = {
  contact: 'Contact',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
}
const HEADING_TERMS: Record<SectionTitleKey, RegExp> = {
  contact: /contact|details|information/i,
  summary: /summary|profile|objective|about/i,
  experience: /experience|employment|work|career|history/i,
  education: /education|academic|qualification/i,
  skills: /skills|expertise|competenc|technolog|tools/i,
  projects: /projects|portfolio/i,
  certifications: /certif|licen|credential/i,
}
export const words = (text: string) => text.trim().split(/\s+/).filter(Boolean)
export const normalize = (text: string) =>
  text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
export const cleanBullet = (text: string) =>
  text
    .replace(/^\s*(?:[•●▪◦]\s*|[*–—-]\s+)/, '')
    .replace(/[\t\u00a0 ]+/g, ' ')
    .trim()
export const visible = <T extends { visible: boolean }>(
  resume: Resume,
  section: SectionType,
  items: T[]
) => (resume.sectionOrder.includes(section) ? items.filter((item) => item.visible) : [])

/** Accept the editor's free-form month/year dates without guessing ambiguous numeric dates. */
export function dateMonth(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/\./g, '')
  const iso = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(text)
  if (iso) {
    const year = Number(iso[1]),
      month = Number(iso[2] ?? 1),
      day = Number(iso[3] ?? 1)
    if (
      year < 1900 ||
      year > 2200 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > new Date(year, month, 0).getDate()
    )
      return null
    return year * 12 + month - 1
  }
  const named =
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|sept|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})$/.exec(
      text
    )
  if (!named) return null
  const year = Number(named[2])
  return year >= 1900 && year <= 2200
    ? year * 12 +
        [
          'jan',
          'feb',
          'mar',
          'apr',
          'may',
          'jun',
          'jul',
          'aug',
          'sep',
          'oct',
          'nov',
          'dec',
        ].indexOf(named[1].slice(0, 3))
    : null
}
const isPresent = (value: string) => /^(present|current|now)$/i.test(value.trim())
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const validUrl = (value: string) => {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    return (
      ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') && !/\s/.test(value)
    )
  } catch {
    return false
  }
}
const ACTIONS = new Set(
  'achieve achieved administer administered advise advised analyze analyzed analyse analysed assess assessed audit audited automate automated build built coach coached collaborate collaborated communicate communicated conduct conducted consolidate consolidated coordinate coordinated create created define defined deliver delivered deploy deployed design designed develop developed direct directed document documented drive drove enable enabled engineer engineered establish established evaluate evaluated execute executed expand expanded facilitate facilitated forecast forecasted generate generated grow grew guide guided implement implemented improve improved increase increased initiate initiated integrate integrated introduce introduced launch launched lead led maintain maintained manage managed mentor mentored negotiate negotiated optimize optimized organise organised organize organized oversee oversaw own owned partner partnered plan planned prioritize prioritized produce produced recommend recommended recruit recruited reduce reduced research researched resolve resolved review reviewed sell sold serve served ship shipped simplify simplified solve solved standardize standardized streamline streamlined supervise supervised support supported test tested train trained transform transformed write wrote'.split(
    ' '
  )
)
const hasMetric = (text: string) =>
  /(?:[$€£₹]\s*\d|\d[\d,.]*\s*(?:%|percent\b|users?\b|customers?\b|clients?\b|people\b|employees?\b|engineers?\b|designers?\b|members?\b|hours?\b|days?\b|weeks?\b|months?\b|million\b|billion\b|projects?\b|releases?\b|accounts?\b)|\b(?:team of|by|from|to)\s+\d[\d,.]*\s*(?:%|percent\b|people\b|hours?\b|days?\b))/i.test(
    text
  )
const PLACEHOLDERS =
  /\b(?:lorem ipsum|your (?:name|email|company|title)|company name|insert here|TODO|TBD)\b|\[(?:number|result|company|skill|your[^\]]*)\]|@example\.(?:com|org|net)\b/i

export function unusualHeadings(resume: Resume) {
  return (Object.entries(resume.sectionTitles ?? {}) as [SectionTitleKey, string][]).filter(
    ([key, value]) =>
      (key === 'contact' || resume.sectionOrder.includes(key)) && !HEADING_TERMS[key].test(value)
  )
}

/** Only visible, authored content is used for keyword coverage and writing checks. */
export function resumeTextSections(
  resume: Resume
): { label: string; text: string; destination: AtsDestination }[] {
  return [
    { label: 'Headline', text: resume.personalInfo.headline, destination: 'personal' as const },
    ...(resume.sectionOrder.includes('summary') && resume.summary.visible
      ? [{ label: 'Summary', text: resume.summary.content, destination: 'summary' as const }]
      : []),
    ...visible(resume, 'experience', resume.experience).map((e) => ({
      label: e.role || 'Experience',
      text: [e.role, e.company, ...e.description, ...e.technologies].join(' '),
      destination: 'experience' as const,
    })),
    ...visible(resume, 'education', resume.education).map((e) => ({
      label: e.institution || 'Education',
      text: [e.institution, e.degree, e.fieldOfStudy, ...e.description].join(' '),
      destination: 'education' as const,
    })),
    ...visible(resume, 'skills', resume.skills).map((e) => ({
      label: e.category || 'Skills',
      text: e.skills.map((s) => s.name).join(', '),
      destination: 'skills' as const,
    })),
    ...visible(resume, 'projects', resume.projects).map((e) => ({
      label: e.title || 'Project',
      text: [e.title, e.description, ...e.technologies].join(' '),
      destination: 'projects' as const,
    })),
    ...visible(resume, 'certifications', resume.certifications).map((e) => ({
      label: e.title || 'Certification',
      text: `${e.title} ${e.issuer}`,
      destination: 'certifications' as const,
    })),
    ...visible(resume, 'custom', resume.customSections).map((e) => ({
      label: e.title,
      text: e.items.map((i) => `${i.title} ${i.subtitle} ${i.description}`).join(' '),
      destination: 'custom' as const,
    })),
  ]
}

/** Transparent local heuristics; points are our rubric, never a vendor's ATS score. */
export function evaluateAts(
  template: TemplateDefinition,
  resume: Resume,
  layoutTree?: LayoutTree | null,
  now = new Date()
): AtsReport {
  const checks: AtsCheck[] = []
  const add = (check: Omit<AtsCheck, 'status'>, passed = check.points === check.max) =>
    checks.push({ ...check, status: passed ? 'passed' : 'review' })
  const info = resume.personalInfo
  const roles = visible(resume, 'experience', resume.experience)
  const projects = visible(resume, 'projects', resume.projects)
  const education = visible(resume, 'education', resume.education)
  const skillGroups = visible(resume, 'skills', resume.skills)
  const textSections = resumeTextSections(resume)
  const wordCount = words(textSections.map((s) => s.text).join(' ')).length
  const unknownHeadings = unusualHeadings(resume)
  const column = template.layout === 'single-column'
  add({
    id: 'reading-order',
    label: 'Reading order',
    category: 'Parsing & layout',
    points: column ? 10 : 7,
    max: 10,
    priority: 'medium',
    evidence: [`${template.name}: ${column ? 'one' : 'two'} column layout.`],
    advice:
      'A single column reduces reading-order ambiguity. Multiple columns can work, but parsing varies by system.',
    destination: 'design',
    fix: 'single-column',
  })
  const photo = template.exportRules.includeProfileImage && resume.settings.showProfileImage
  add({
    id: 'photo',
    label: 'Profile graphics',
    category: 'Parsing & layout',
    points: photo ? 3 : 5,
    max: 5,
    priority: 'low',
    evidence: [
      photo
        ? 'A profile image or initials region is enabled.'
        : 'No profile image region is enabled.',
    ],
    advice:
      'For a text-focused application, hide the profile image. Follow the employer’s local requirements.',
    destination: 'personal',
    fix: 'hide-photo',
  })
  add({
    id: 'headings',
    label: 'Recognizable section headings',
    category: 'Parsing & layout',
    points: unknownHeadings.length ? 5 : 10,
    max: 10,
    priority: 'medium',
    evidence: unknownHeadings.length
      ? unknownHeadings.map(([key, title]) => `${key}: “${title}”`)
      : ['Visible section headings use recognizable labels.'],
    advice: 'Use familiar headings so readers can identify each section.',
    destination: 'design',
    fix: 'headings',
  })

  const contacts: [string, string, boolean, number, string][] = [
    ['name', 'Name', Boolean(info.fullName.trim()), 4, 'Add the name you use professionally.'],
    [
      'email',
      'Email address',
      validEmail(info.email),
      6,
      'Add a complete email address, such as name@domain.com.',
    ],
    [
      'phone',
      'Phone number',
      /^[+\d\s().-]+(?:\s*(?:ext\.?|x)\s*\d+)?$/i.test(info.phone.trim()) &&
        info.phone.replace(/\D/g, '').length >= 7 &&
        info.phone.replace(/\D/g, '').length <= 18,
      3,
      'Use a complete phone number with country code when relevant.',
    ],
    [
      'location',
      'Location',
      Boolean(info.location.trim()),
      2,
      'Include your city and region, or the location relevant to your search.',
    ],
  ]
  for (const [id, label, valid, max, advice] of contacts) {
    const value = id === 'name' ? info.fullName : info[id as 'email' | 'phone' | 'location']
    add({
      id,
      label,
      category: 'Contact',
      points: valid ? max : 0,
      max,
      priority: id === 'name' || id === 'email' ? 'high' : 'medium',
      evidence: [value.trim() || `${label} is missing.`],
      advice,
      destination: 'personal',
    })
  }
  const badLinks = (['website', 'linkedin', 'github', 'portfolio'] as const).filter(
    (key) => info[key].trim() && !validUrl(info[key].trim())
  )
  add(
    {
      id: 'links',
      label: 'Contact links',
      category: 'Contact',
      points: 0,
      max: 0,
      priority: 'medium',
      evidence: badLinks.length
        ? badLinks.map((key) => `${key}: ${info[key]}`)
        : ['Optional links are absent or have a valid URL format.'],
      advice: 'Use a full, valid web address. Link destinations are not checked online.',
      destination: 'personal',
    },
    !badLinks.length
  )

  const summaryWords =
    resume.summary.visible && resume.sectionOrder.includes('summary')
      ? words(resume.summary.content).length
      : 0
  add({
    id: 'summary',
    label: 'Focused summary',
    category: 'Writing',
    points: summaryWords >= 25 && summaryWords <= 100 ? 8 : summaryWords ? 4 : 0,
    max: 8,
    priority: 'low',
    evidence: [`${summaryWords} words in the visible summary.`],
    advice:
      'Aim for roughly 25–100 relevant words: your role, strengths, and evidence. This is a writing guideline, not an ATS requirement.',
    destination: 'summary',
  })

  const useProjects = !roles.length && projects.length > 0
  const history = useProjects ? projects : roles
  const historyDestination = useProjects ? 'projects' : 'experience'
  const complete = useProjects
    ? projects.filter((e) => e.title.trim() && e.description.trim()).length
    : roles.filter((e) => e.role.trim() && e.company.trim()).length
  add({
    id: 'history-details',
    label: useProjects ? 'Project details' : 'Role and employer details',
    category: 'Career history',
    points: history.length ? Math.round((8 * complete) / history.length) : 0,
    max: 8,
    priority: 'high',
    evidence: history.length
      ? [
          `${complete} of ${history.length} visible ${useProjects ? 'projects have a title and description' : 'roles have both a title and employer'}.`,
        ]
      : ['No visible experience or project entries.'],
    advice:
      'Identify every role and employer. If you are starting out, projects can provide useful evidence instead.',
    destination: historyDestination,
  })
  const currentMonth = now.getFullYear() * 12 + now.getMonth()
  const dateProblems = history.flatMap((entry) => {
    const label =
      'role' in entry
        ? entry.role || entry.company || 'Untitled role'
        : entry.title || 'Untitled project'
    if (useProjects && !entry.startDate.trim() && !entry.endDate.trim()) return []
    const start = dateMonth(entry.startDate)
    const current = ('current' in entry && entry.current) || isPresent(entry.endDate)
    const end = current ? currentMonth : dateMonth(entry.endDate)
    const reasons = [
      start === null
        ? 'start date missing or unreadable'
        : start > currentMonth
          ? 'start date is in the future'
          : '',
      end === null
        ? 'end date missing or unreadable'
        : !current && end > currentMonth
          ? 'end date is in the future'
          : '',
      start !== null && end !== null && start > end ? 'end date precedes start date' : '',
    ].filter(Boolean)
    return reasons.length ? [`${label}: ${reasons.join('; ')}.`] : []
  })
  add({
    id: 'dates',
    label: 'Complete and consistent dates',
    category: 'Career history',
    points: history.length
      ? Math.round((7 * (history.length - dateProblems.length)) / history.length)
      : 0,
    max: 7,
    priority: 'high',
    evidence: dateProblems.length
      ? dateProblems
      : [
          history.length
            ? 'Visible date ranges are valid. Dates are optional for projects.'
            : 'Add work history or projects to check dates.',
        ],
    advice:
      'Use Jan 2024, 2024-01, or 2024 consistently. Mark ongoing roles as current; correct reversed or future work dates.',
    destination: historyDestination,
  })
  const historyDetails = useProjects
    ? projects.map((e) => ({
        label: e.title,
        bullets: e.description.split(/\n+/).filter((s) => s.trim()),
      }))
    : roles.map((e) => ({ label: e.role, bullets: e.description.filter((s) => s.trim()) }))
  const described = historyDetails.filter((e) => e.bullets.length > 0).length
  add({
    id: 'descriptions',
    label: 'Evidence for each role or project',
    category: 'Career history',
    points: history.length ? Math.round((5 * described) / history.length) : 0,
    max: 5,
    priority: 'high',
    evidence: [`${described} of ${history.length} entries include responsibilities or outcomes.`],
    advice:
      'Describe what you did, how you did it, and the result. Use only facts you can support.',
    destination: historyDestination,
  })
  const roleDates = [...roles].sort((a, b) => a.order - b.order).map((e) => dateMonth(e.startDate))
  const outOfOrder = roleDates.some(
    (date, i) => i > 0 && date !== null && roleDates[i - 1] !== null && date > roleDates[i - 1]!
  )
  add(
    {
      id: 'chronology',
      label: 'Most recent experience first',
      category: 'Career history',
      points: 0,
      max: 0,
      priority: 'low',
      evidence: [
        outOfOrder
          ? 'A newer start date appears after an older role.'
          : 'Work history is ordered by recent start date, or cannot yet be compared.',
      ],
      advice:
        'Consider reverse chronological order. Concurrent roles can be arranged to emphasize relevance.',
      destination: 'experience',
      fix: roleDates.every((d) => d !== null) ? 'sort-experience' : undefined,
    },
    !outOfOrder
  )

  const validEducation = education.filter(
    (e) => e.institution.trim() && (e.degree.trim() || e.fieldOfStudy.trim())
  )
  add({
    id: 'education',
    label: 'Education details',
    category: 'Career history',
    points: education.length ? Math.round((6 * validEducation.length) / education.length) : 0,
    max: 6,
    priority: 'medium',
    evidence: [
      `${validEducation.length} complete education entries of ${education.length} visible.`,
    ],
    advice:
      'Include the institution and qualification or field of study. List only education you actually completed or are pursuing.',
    destination: 'education',
  })

  const bullets = historyDetails.flatMap((entry) =>
    entry.bullets.map((text) => ({ text: cleanBullet(text), label: entry.label }))
  )
  const actionBullets = bullets.filter((b) => ACTIONS.has(normalize(b.text).split(/[^a-z]+/)[0]))
  const metrics = bullets.filter((b) => hasMetric(b.text))
  const repeated = bullets.filter(
    (b, i) => bullets.findIndex((other) => normalize(other.text) === normalize(b.text)) < i
  )
  const examples = (items: typeof bullets) =>
    items.slice(0, 4).map((b) => `${b.label || 'Entry'}: “${b.text}”`)
  add({
    id: 'action-verbs',
    label: 'Action-led descriptions',
    category: 'Writing',
    points: bullets.length ? Math.round((5 * actionBullets.length) / bullets.length) : 0,
    max: 5,
    priority: 'medium',
    evidence: [
      `${actionBullets.length} of ${bullets.length} descriptions start with a recognized action verb.`,
      ...examples(bullets.filter((b) => !actionBullets.includes(b))),
    ],
    advice:
      'Start with a specific action you performed, such as built, analyzed, coordinated, or improved. This English-language check uses a limited vocabulary.',
    destination: historyDestination,
  })
  add({
    id: 'outcomes',
    label: 'Measurable outcomes',
    category: 'Writing',
    points: bullets.length
      ? Math.min(5, Math.round((5 * metrics.length) / Math.max(1, Math.ceil(bullets.length / 3))))
      : 0,
    max: 5,
    priority: 'medium',
    evidence: [
      `${metrics.length} of ${bullets.length} descriptions contain a measurable quantity or outcome. Standalone years and software versions do not count.`,
    ],
    advice:
      'Where relevant, add a real result: time saved, people supported, revenue, or quality improvement. Never invent a number just to raise the score.',
    destination: historyDestination,
  })
  add({
    id: 'duplicates',
    label: 'Distinct descriptions',
    category: 'Writing',
    points: repeated.length ? 0 : 2,
    max: 2,
    priority: 'low',
    evidence: repeated.length ? examples(repeated) : ['No repeated visible descriptions found.'],
    advice:
      'Remove exact repeats within the same role. Across different roles, explain the distinct contribution.',
    destination: historyDestination,
    fix:
      !useProjects &&
      roles.some(
        (e) =>
          new Set(e.description.map((text) => normalize(cleanBullet(text)))).size <
          e.description.length
      )
        ? 'clean-bullets'
        : undefined,
  })
  const longBullets = bullets.filter((b) => words(b.text).length > 45)
  add(
    {
      id: 'bullet-length',
      label: 'Scannable descriptions',
      category: 'Writing',
      points: 0,
      max: 0,
      priority: 'low',
      evidence: longBullets.length
        ? examples(longBullets)
        : ['Descriptions are within the 45-word review guideline.'],
      advice:
        'Consider splitting long descriptions into a clear action and result. Preserve the facts and important context.',
      destination: historyDestination,
    },
    !longBullets.length
  )

  const skills = skillGroups.flatMap((g) => g.skills.map((s) => s.name.trim()).filter(Boolean))
  const uniqueSkills = [...new Set(skills.map(normalize))]
  add({
    id: 'skills',
    label: 'Named skills',
    category: 'Skills',
    points: Math.min(8, uniqueSkills.length * 2),
    max: 8,
    priority: 'medium',
    evidence: [`${uniqueSkills.length} distinct skills in visible skills sections.`],
    advice:
      'List a focused set of relevant skills you actually have. Four named skills meet this guideline; relevance matters more than volume.',
    destination: 'skills',
  })
  const duplicateSkills = skillGroups.some(
    (g) => new Set(g.skills.map((s) => normalize(s.name))).size < g.skills.length
  )
  add({
    id: 'skill-duplicates',
    label: 'Clean skills list',
    category: 'Skills',
    points: duplicateSkills ? 0 : 2,
    max: 2,
    priority: 'low',
    evidence: [
      duplicateSkills
        ? 'A skill is repeated within the same skills group.'
        : 'No duplicate skills within a group.',
    ],
    advice: 'Keep one occurrence of a repeated skill within each group.',
    destination: 'skills',
    fix: 'deduplicate-skills',
  })

  const placeholders = [
    { label: 'Contact', text: Object.values(info).join(' '), destination: 'personal' as const },
    ...textSections,
  ].filter((s) => PLACEHOLDERS.test(s.text))
  add({
    id: 'placeholders',
    label: 'No placeholder content',
    category: 'Writing',
    points: placeholders.length ? 0 : 2,
    max: 2,
    priority: 'high',
    evidence: placeholders.length
      ? placeholders.map((s) => `${s.label}: “${s.text.match(PLACEHOLDERS)?.[0]}”`)
      : ['No common placeholder patterns found.'],
    advice:
      'Replace sample contact details and placeholders with your own facts. Check the rest of any mock data before applying.',
    destination: placeholders[0]?.destination ?? 'personal',
  })
  const uncleanBullets = roles.some((e) =>
    e.description.some((b) => b !== cleanBullet(b) || !b.trim())
  )
  add({
    id: 'bullet-format',
    label: 'Clean bullet formatting',
    category: 'Writing',
    points: uncleanBullets ? 0 : 2,
    max: 2,
    priority: 'low',
    evidence: [
      uncleanBullets
        ? 'Found extra bullet markers, blank bullets, or unnecessary spacing.'
        : 'No duplicate bullet markers or blank bullets found.',
    ],
    advice:
      'The template supplies bullet markers. Remove typed markers, extra spaces and empty bullets.',
    destination: 'experience',
    fix: 'clean-bullets',
  })

  if (layoutTree) {
    const { tiny, outside } = inspectAtsLayout(layoutTree)
    add(
      {
        id: 'small-text',
        label: 'Readable text size',
        category: 'Parsing & layout',
        points: 0,
        max: 0,
        priority: 'medium',
        evidence: tiny.length
          ? [
              `${tiny.length} text elements are smaller than 9 pt.`,
              ...tiny
                .slice(0, 3)
                .map(
                  ({ node, page }) => `Page ${page}: ${node.styles.fontSize} pt — “${node.content}”`
                ),
            ]
          : ['Rendered text is at least 9 pt.'],
        advice:
          'Increase text below 9 pt for easier reading. Readability guidance is separate from machine parsing.',
        destination: 'design',
        fix: 'readable-text',
      },
      !tiny.length
    )
    add(
      {
        id: 'page-bounds',
        label: 'Content within page bounds',
        category: 'Parsing & layout',
        points: 0,
        max: 0,
        priority: 'high',
        evidence: outside.length
          ? outside
              .slice(0, 4)
              .map(({ node, page }) => `Page ${page}: “${node.content}” extends past the page.`)
          : ['No text boxes extend beyond the rendered page.'],
        advice:
          'Adjust text sizing and page spacing to keep content on the page. This checks text-box bounds, not PDF extraction or every possible overlap.',
        destination: 'design',
        fix: 'page-bounds',
      },
      !outside.length
    )
  }
  const categories = (
    ['Parsing & layout', 'Contact', 'Career history', 'Writing', 'Skills'] as AtsCategory[]
  ).map((label) => ({
    label,
    score: checks.filter((c) => c.category === label).reduce((n, c) => n + c.points, 0),
    max: checks.filter((c) => c.category === label).reduce((n, c) => n + c.max, 0),
  }))
  return {
    score: checks.reduce((n, c) => n + c.points, 0),
    checks,
    categories,
    wordCount,
    pageCount: layoutTree?.pages.length ?? null,
  }
}
