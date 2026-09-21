import type { Resume } from '@/shared/types/resume.types'
import { normalize, resumeTextSections } from './evaluate'

// Explicit aliases keep technical tokens such as C++, C#, .NET and Java distinct.
const TERMS: Record<string, string[]> = {
  JavaScript: ['javascript', 'js'],
  TypeScript: ['typescript'],
  Java: ['java'],
  Python: ['python'],
  'C++': ['c++'],
  'C#': ['c#', 'c sharp'],
  '.NET': ['.net', 'dotnet'],
  SQL: ['sql'],
  React: ['react', 'react.js', 'reactjs'],
  'Node.js': ['node.js', 'nodejs', 'node js'],
  Angular: ['angular'],
  Vue: ['vue', 'vue.js', 'vuejs'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3'],
  Git: ['git'],
  Docker: ['docker'],
  Kubernetes: ['kubernetes', 'k8s'],
  AWS: ['aws', 'amazon web services'],
  Azure: ['azure'],
  'Google Cloud': ['google cloud', 'gcp'],
  PostgreSQL: ['postgresql', 'postgres'],
  MySQL: ['mysql'],
  MongoDB: ['mongodb'],
  Redis: ['redis'],
  GraphQL: ['graphql'],
  'REST APIs': ['rest api', 'rest apis', 'restful'],
  'CI/CD': ['ci/cd', 'continuous integration', 'continuous delivery'],
  Terraform: ['terraform'],
  Linux: ['linux'],
  Swift: ['swift'],
  Kotlin: ['kotlin'],
  'Machine learning': ['machine learning'],
  'Data analysis': ['data analysis', 'data analytics'],
  'Data visualization': ['data visualization', 'data visualisation'],
  Tableau: ['tableau'],
  'Power BI': ['power bi'],
  Excel: ['excel'],
  'A/B testing': ['a/b testing', 'ab testing'],
  Figma: ['figma'],
  'User research': ['user research', 'ux research'],
  'Product design': ['product design'],
  'Product management': ['product management'],
  Roadmapping: ['roadmapping', 'product roadmap', 'product roadmaps'],
  'Project management': ['project management'],
  'Program management': ['program management', 'programme management'],
  'Stakeholder management': ['stakeholder management'],
  'Change management': ['change management'],
  Agile: ['agile'],
  Scrum: ['scrum'],
  Jira: ['jira'],
  Salesforce: ['salesforce'],
  HubSpot: ['hubspot'],
  'Customer service': ['customer service', 'customer support'],
  'Account management': ['account management'],
  'Business development': ['business development'],
  'Lead generation': ['lead generation'],
  'Digital marketing': ['digital marketing'],
  SEO: ['seo', 'search engine optimization'],
  'Content marketing': ['content marketing'],
  Copywriting: ['copywriting'],
  Budgeting: ['budgeting'],
  Forecasting: ['forecasting'],
  'Financial analysis': ['financial analysis'],
  Accounting: ['accounting'],
  Bookkeeping: ['bookkeeping'],
  Auditing: ['auditing'],
  'Risk management': ['risk management'],
  Compliance: ['compliance'],
  Procurement: ['procurement'],
  'Supply chain': ['supply chain'],
  'Inventory management': ['inventory management'],
  Recruiting: ['recruiting', 'recruitment'],
  Payroll: ['payroll'],
  'Employee relations': ['employee relations'],
  'Quality assurance': ['quality assurance', 'qa'],
  'Technical writing': ['technical writing'],
  'Patient care': ['patient care'],
  'Clinical research': ['clinical research'],
  'Lesson planning': ['lesson planning'],
  'Curriculum development': ['curriculum development'],
  'Process improvement': ['process improvement'],
  'Business analysis': ['business analysis'],
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function contains(text: string, term: string) {
  const normalizedText = normalize(text).replace(/[‐‑–—]/g, '-')
  const normalizedTerm = normalize(term)
  const alternatives = TERMS[
    Object.keys(TERMS).find((key) => normalize(key) === normalizedTerm) ?? ''
  ] ?? [term]
  return alternatives.some((alias) =>
    new RegExp(
      `(^|[^\\p{L}\\p{N}+#])${escape(normalize(alias)).replace(/ /g, '[\\s-]+')}(?=$|[^\\p{L}\\p{N}+#])`,
      'iu'
    ).test(normalizedText)
  )
}

export function extractJobKeywords(description: string, resume: Resume): string[] {
  if (!description.trim()) return []
  const known = Object.keys(TERMS).filter((term) => contains(description, term))
  const authored = resume.skills
    .flatMap((group) => group.skills.map((skill) => skill.name.trim()))
    .filter((term) => term.length >= 2 && contains(description, term))
  const seen = new Set(known.map(normalize))
  return [
    ...known,
    ...authored.filter((term) => {
      if (seen.has(normalize(term))) return false
      seen.add(normalize(term))
      return true
    }),
  ].slice(0, 60)
}

export function evaluateJobMatch(resume: Resume, keywords: string[]) {
  const sections = resumeTextSections(resume)
  const unique = [
    ...new Map(
      keywords
        .map((term) => term.trim())
        .filter(Boolean)
        .map((term) => [normalize(term), term])
    ).values(),
  ].slice(0, 60)
  const terms = unique.map((term) => {
    const locations = sections
      .filter((section) => contains(section.text, term))
      .map((section) => section.label)
    return { term, matched: locations.length > 0, locations: [...new Set(locations)] }
  })
  const matchedCount = terms.filter((term) => term.matched).length
  return {
    score: terms.length ? Math.round((matchedCount * 100) / terms.length) : null,
    matchedCount,
    terms,
  }
}
