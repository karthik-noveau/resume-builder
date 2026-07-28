import type { FontFamily, FontWeight } from './font.types'
import type { SectionType } from './resume.types'

export type LayoutNodeType =
  | 'page'
  | 'section'
  | 'section-header'
  | 'entry'
  | 'entry-header'
  | 'entry-body'
  | 'text'
  | 'bullet'
  | 'tag'
  | 'divider'
  | 'image'
  | 'link'
  | 'rect'
  | 'icon'

/**
 * Names of the icon library — see engine/icons.ts for the glyph data and
 * ICON_LIBRARY for the grouping the picker renders.
 *
 * Contact glyphs are fixed to their field (a phone row always shows a phone).
 * Everything below them is selectable per section.
 */
export type IconName =
  // Contact — bound to a personal-info field, not user-selectable
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'globe'
  | 'linkedin'
  | 'github'
  // People
  | 'user'
  | 'users'
  | 'user-check'
  | 'contact'
  | 'smile'
  | 'handshake'
  | 'heart'
  | 'message-circle'
  | 'crown'
  // Work
  | 'briefcase'
  | 'building'
  | 'building-2'
  | 'network'
  | 'workflow'
  | 'target'
  | 'rocket'
  | 'milestone'
  | 'presentation'
  | 'folder'
  // Growth & data
  | 'trending-up'
  | 'chart-column'
  | 'chart-line'
  | 'chart-pie'
  | 'activity'
  | 'zap'
  | 'calendar'
  | 'clock'
  | 'clipboard-list'
  // Learning
  | 'graduation-cap'
  | 'book'
  | 'book-open'
  | 'library'
  | 'brain'
  | 'lightbulb'
  | 'microscope'
  | 'flask'
  | 'languages'
  // Craft & tools
  | 'code'
  | 'terminal'
  | 'cpu'
  | 'database'
  | 'server'
  | 'cloud'
  | 'git-branch'
  | 'wrench'
  | 'settings'
  | 'puzzle'
  | 'bot'
  | 'layers'
  | 'sliders'
  // Creative
  | 'palette'
  | 'paintbrush'
  | 'pen'
  | 'pen-tool'
  | 'camera'
  | 'image'
  | 'film'
  | 'music'
  | 'mic'
  // Recognition
  | 'award'
  | 'trophy'
  | 'medal'
  | 'star'
  | 'gem'
  | 'shield'
  | 'flag'
  | 'bookmark'
  | 'sparkles'
  // Interests
  | 'plane'
  | 'map'
  | 'compass'
  | 'leaf'
  | 'dumbbell'
  | 'mountain'

/** The section types that render as a list of ided entries with per-entry canvas nodes. */
export type EntrySectionType = 'experience' | 'education' | 'projects' | 'certifications'

/**
 * Field-provenance tag enabling click-to-edit on canvas and entry-level
 * canvas selection. Purely additive metadata on the ephemeral LayoutTree —
 * never persisted to Resume/IndexedDB, and ignored by PDF export
 * (pdf.generator.ts switches on `type` only).
 */
export type EditRef =
  | { kind: 'personal-info'; field: 'fullName' | 'headline' }
  | { kind: 'summary' }
  | { kind: 'entry'; sectionType: EntrySectionType; entryId: string }
  | { kind: 'entry-field'; sectionType: EntrySectionType; entryId: string; field: string }
  | { kind: 'entry-list-item'; sectionType: 'experience'; entryId: string; field: 'description'; index: number }

export interface LayoutStyles {
  fontFamily: FontFamily
  fontSize: number
  fontWeight: FontWeight
  color: string
  backgroundColor?: string
  lineHeight: number
  letterSpacing?: number
  textAlign: 'left' | 'center' | 'right'
  textDecoration?: 'none' | 'underline'
  /** Set by metadataStyle for italic dates/locations, and read by the canvas. */
  fontStyle?: 'normal' | 'italic'
  paddingTopPt?: number
  paddingRightPt?: number
  paddingBottomPt?: number
  paddingLeftPt?: number
}

export interface LayoutNode {
  id: string
  type: LayoutNodeType
  /** X position in points from page left edge. */
  xPt: number
  /** Y position in points from page top edge. */
  yPt: number
  widthPt: number
  heightPt: number
  styles: LayoutStyles
  children: LayoutNode[]
  /** Set on type==='section' nodes to enable canvas selection. */
  sectionType?: SectionType
  content?: string
  href?: string
  /** References ImageAsset.id stored in IndexedDB. */
  imageId?: string
  /** For type==='image': crop shape applied on top of the raster image. */
  clipShape?: 'circle'
  /** For type==='icon': which glyph to draw, colored via styles.color. */
  iconName?: IconName
  /**
   * Marks a section-header icon the user is allowed to change. The canvas uses
   * it to show an affordance; the PDF ignores it entirely.
   */
  iconEditable?: boolean
  /** Rotation applied around the node's center, in degrees. Used for decorative rects. */
  rotationDeg?: number
  /** Set when this node maps back to an editable Resume field or entry. */
  editRef?: EditRef
}

export interface LayoutPage {
  pageNumber: number
  /** Page width in points. A4 = 595.28, Letter = 612. */
  widthPt: number
  /** Page height in points. A4 = 841.89, Letter = 792. */
  heightPt: number
  marginsPt: {
    top: number
    right: number
    bottom: number
    left: number
  }
  nodes: LayoutNode[]
}

export interface LayoutTree {
  resumeId: string
  templateId: string
  themeId: string
  fontPresetId: string
  pageSize: 'A4' | 'LETTER'
  pages: LayoutPage[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Points-to-pixels conversion factor at 96 DPI. */
export const PT_TO_PX = 96 / 72

export const PAGE_DIMENSIONS_PT = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612, height: 792 },
} as const

export const DEFAULT_MARGINS_MM = 15
export const MM_TO_PT = 2.8346
