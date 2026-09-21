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

/**
 * The three states a canvas node can show, in deliberate order of weight.
 *
 * Only the style target draws a full-strength stroke. A resume is mostly text,
 * and a saturated 2px box around a line of it reads as a debug outline rather
 * than product chrome — so hover and selection carry their meaning with a wash
 * and a soft halo instead. That difference in kind, not just in colour, is what
 * lets a selected entry and a targeted element inside it be legible at once;
 * the previous pair were both hard rings, and the dash used to tell them apart
 * only added texture to the noise.
 */
export interface CanvasStateStyle {
  outline: string
  outlineOffset: string
  background: string
  shadow?: string
}

export const CANVAS_HOVER: CanvasStateStyle = {
  outline: '1px solid rgb(var(--color-primary) / 14%)',
  outlineOffset: '3px',
  background: 'rgb(var(--color-primary) / 3.5%)',
}

export const CANVAS_SELECTED: CanvasStateStyle = {
  outline: '1px solid rgb(var(--color-primary) / 30%)',
  outlineOffset: '4px',
  background: 'rgb(var(--color-primary) / 4%)',
  shadow: '0 0 0 5px rgb(var(--color-primary) / 6%)',
}

export const CANVAS_STYLE_TARGET: CanvasStateStyle = {
  outline: '1.5px solid rgb(var(--color-primary) / 85%)',
  outlineOffset: '3px',
  background: 'rgb(var(--color-primary) / 6%)',
  shadow: '0 0 0 4px rgb(var(--color-primary) / 13%)',
}

/** Rounded enough to read as a surface, not so round it looks like a pill. */
export const CANVAS_STATE_RADIUS = '5px'

export const CANVAS_STATE_TRANSITION = [
  'outline-color 160ms cubic-bezier(0.4, 0, 0.2, 1)',
  'background-color 160ms cubic-bezier(0.4, 0, 0.2, 1)',
  'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
].join(', ')
