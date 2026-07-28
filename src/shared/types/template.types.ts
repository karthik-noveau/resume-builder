import type { IconName } from './layout.types'
import type { SectionType } from './resume.types'
import type { FontWeight } from './font.types'

export type PageLayoutType = 'single-column' | 'two-column'

export interface PageLayout {
  type: PageLayoutType
  columns?: {
    leftPercent: number
    rightPercent: number
  }
  leftSections?: SectionType[]
  rightSections?: SectionType[]
}

export type RenderMode = 'standard' | 'compact' | 'detailed'

export interface SectionConfig {
  type: SectionType
  defaultOrder: number
  visible: boolean
  collapsible: boolean
  renderMode: RenderMode
}

export interface TypographyConfig {
  nameWeight: FontWeight
  sectionTitleWeight: FontWeight
  entryTitleWeight: FontWeight
  bodyWeight: FontWeight
  uppercaseSectionTitles: boolean
  showSectionDividers: boolean
}

export interface SpacingConfig {
  sectionGapPt: number
  entryGapPt: number
  itemGapPt: number
  sectionTitleBottomPt: number
  headerBottomPt: number
}

export interface ExportRules {
  includeProfileImage: boolean
  /** Forces all text to #000000 for maximum ATS safety. */
  forceBlackText: boolean
}

export type TemplateCategory = 'Fresher' | 'Experienced'

export interface TemplateDefinition {
  id: string
  name: string
  category: TemplateCategory
  version: number
  description: string
  thumbnail: string
  /** 0–100. 100 = fully ATS-safe. */
  tags: string[]
  /**
   * Default section-header icons this template draws. Absent means the template
   * has no section icons at all, which is also what the editor keys off to
   * decide whether to offer the icon picker. Users override per section via
   * `Resume.sectionIcons`.
   */
  /**
   * Column structure. Read by the ATS scorer — a two-column layout interleaves
   * text in the PDF's text layer, which is the main reason parsers mis-read a
   * résumé. Not decorative: changing it changes the score.
   */
  layout: 'single-column' | 'two-column'
  sectionIcons?: Partial<Record<SectionType, IconName>>
  exportRules: ExportRules
}
