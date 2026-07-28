import { PT_TO_PX, PAGE_DIMENSIONS_PT, MM_TO_PT, DEFAULT_MARGINS_MM } from '@/shared/types/layout.types'

export { PT_TO_PX }

export const PAGE_DIMENSIONS_PX = {
  A4: {
    width: PAGE_DIMENSIONS_PT.A4.width * PT_TO_PX,
    height: PAGE_DIMENSIONS_PT.A4.height * PT_TO_PX,
  },
  LETTER: {
    width: PAGE_DIMENSIONS_PT.LETTER.width * PT_TO_PX,
    height: PAGE_DIMENSIONS_PT.LETTER.height * PT_TO_PX,
  },
} as const

export const DEFAULT_MARGINS_PT = DEFAULT_MARGINS_MM * MM_TO_PT

export const CANVAS_PAGE_GAP_PX = 24

export const SELECTION_RING = '2px solid rgb(var(--color-primary))'
export const HOVER_RING = '1px solid rgb(var(--color-primary) / 0.3)'
