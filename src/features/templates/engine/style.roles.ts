import type { EditRef, LayoutNode, LayoutPage } from '@/shared/types/layout.types'
import type { StyleRole } from '@/shared/types/style.types'

/**
 * Assigns every node a text role and a stable address for per-element styling.
 *
 * The problem this solves: `LayoutNode.id` is a render-order counter (`n1`,
 * `n2`, …), so adding one bullet renumbers everything after it and any override
 * stored against an id would jump to a different element. The keys built here
 * are derived from semantic position instead — the field an element renders, or
 * its ordinal among same-kind siblings under the nearest addressable ancestor —
 * so they survive edits elsewhere on the resume.
 */

// ─── Element keys ─────────────────────────────────────────────────────────────

export function editRefKey(ref: EditRef): string {
  switch (ref.kind) {
    case 'personal-info': return `personal:${ref.field}`
    case 'summary': return 'summary:text'
    case 'section-title': return `section-title:${ref.sectionType}`
    case 'custom-section-title': return `custom-title:${ref.sectionId}`
    case 'entry': return `entry:${ref.sectionType}:${ref.entryId}`
    case 'entry-field': return `field:${ref.sectionType}:${ref.entryId}:${ref.field}`
    case 'entry-list-item': return `item:${ref.sectionType}:${ref.entryId}:${ref.field}:${ref.index}`
  }
}

// ─── Roles ────────────────────────────────────────────────────────────────────

/**
 * Entry fields that read as the entry's own title or its subtitle. Anything
 * else inside an entry (dates, locations, grades) is `small`, which is the
 * scale the templates already give it.
 */
const ENTRY_TITLE_FIELDS = new Set(['role', 'degree', 'title'])
const ENTRY_SUBTITLE_FIELDS = new Set(['company', 'institution', 'issuer', 'fieldOfStudy'])

const CONTACT_FIELDS = new Set([
  'email', 'phone', 'location', 'website', 'linkedin', 'github', 'portfolio',
])

interface Ctx {
  /** True when the node sits inside an `entry` node. */
  inEntry: boolean
}

function roleFromEditRef(ref: EditRef): StyleRole | undefined {
  switch (ref.kind) {
    case 'personal-info':
      if (ref.field === 'fullName') return 'name'
      if (ref.field === 'headline') return 'headline'
      return CONTACT_FIELDS.has(ref.field) ? 'contact' : 'body'
    case 'summary':
      return 'body'
    case 'section-title':
    case 'custom-section-title':
      return 'sectionTitle'
    case 'entry-field':
      if (ENTRY_TITLE_FIELDS.has(ref.field)) return 'entryTitle'
      if (ENTRY_SUBTITLE_FIELDS.has(ref.field)) return 'body'
      return 'small'
    case 'entry-list-item':
      return 'body'
    case 'entry':
      return undefined
    default:
      return undefined
  }
}

const TEXT_TYPES = new Set<LayoutNode['type']>([
  'text', 'bullet', 'tag', 'link', 'section-header', 'entry-header', 'entry-body',
])

export function isTextNode(node: LayoutNode): boolean {
  return TEXT_TYPES.has(node.type)
}

function roleForNode(node: LayoutNode, ctx: Ctx): StyleRole | undefined {
  if (node.editRef) {
    const fromRef = roleFromEditRef(node.editRef)
    if (fromRef) return fromRef
  }
  if (!isTextNode(node)) return undefined
  if (node.type === 'section-header') return 'sectionTitle'
  if (node.type === 'bullet') return 'body'
  if (node.type === 'tag') return 'small'
  // Un-reffed text inside an entry is the metadata column: dates, locations.
  if (ctx.inEntry) return 'small'
  return 'body'
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full name',
  headline: 'Headline',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  website: 'Website',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
  role: 'Job title',
  company: 'Company',
  degree: 'Degree',
  institution: 'Institution',
  fieldOfStudy: 'Field of study',
  grade: 'Grade',
  issuer: 'Issuer',
  title: 'Title',
  description: 'Description',
}

const TYPE_LABELS: Partial<Record<LayoutNode['type'], string>> = {
  text: 'Text',
  bullet: 'Bullet',
  tag: 'Skill tag',
  link: 'Link',
  divider: 'Divider line',
  rect: 'Shape / panel',
  icon: 'Icon',
  image: 'Photo',
  'section-header': 'Section heading',
  'entry-header': 'Entry heading',
  'entry-body': 'Entry body',
}

function labelForNode(node: LayoutNode): string {
  const ref = node.editRef
  if (ref) {
    switch (ref.kind) {
      case 'personal-info': return FIELD_LABELS[ref.field] ?? ref.field
      case 'summary': return 'Summary'
      case 'section-title': return `${title(ref.sectionType)} heading`
      case 'custom-section-title': return 'Custom section heading'
      case 'entry': return `${title(ref.sectionType)} entry`
      case 'entry-field': return FIELD_LABELS[ref.field] ?? ref.field
      case 'entry-list-item': return `Bullet ${ref.index + 1}`
    }
  }
  return TYPE_LABELS[node.type] ?? 'Element'
}

function title(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// ─── Annotation pass ──────────────────────────────────────────────────────────

/**
 * Walks a page's nodes in place, stamping `styleKey`, `styleRole` and
 * `styleLabel` on each. Nodes that already carry an editRef take its key
 * directly; the rest are addressed as an ordinal among same-kind siblings under
 * the nearest keyed ancestor, which keeps a date or a divider addressable
 * without inventing an editRef for it.
 */
export function annotateStyleTargets(pages: LayoutPage[]): void {
  for (const page of pages) {
    const counters = new Map<string, number>()
    walk(page.nodes, `page:${page.pageNumber}`, counters, { inEntry: false })
  }
}

function walk(nodes: LayoutNode[], anchor: string, counters: Map<string, number>, ctx: Ctx): void {
  for (const node of nodes) {
    let key: string
    if (node.editRef) {
      key = editRefKey(node.editRef)
    } else if (node.type === 'section' && node.sectionType) {
      key = `section:${node.sectionType}`
    } else {
      const bucket = `${anchor}/${node.type}`
      const next = (counters.get(bucket) ?? 0) + 1
      counters.set(bucket, next)
      key = `${bucket}#${next}`
    }

    node.styleKey = key
    node.styleLabel = labelForNode(node)
    const role = roleForNode(node, ctx)
    if (role) node.styleRole = role

    if (node.children.length) {
      const childAnchor = node.editRef || node.type === 'section' ? key : anchor
      // Ordinals restart under a keyed ancestor so an entry's second date is
      // "#2 within this entry", not "#37 on the page" — the latter would shift
      // the moment an earlier section grew.
      const childCounters = childAnchor === anchor ? counters : new Map<string, number>()
      walk(node.children, childAnchor, childCounters, {
        inEntry: ctx.inEntry || node.type === 'entry',
      })
    }
  }
}
