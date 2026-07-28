import type { LayoutStyles } from '@/shared/types/layout.types'
import type { FontFamily } from '@/shared/types/font.types'
import type { CSSProperties } from 'react'
import { PT_TO_PX } from './canvas.constants'

const FONT_FAMILY_CSS: Record<FontFamily, string> = {
  Inter: 'Inter, system-ui, sans-serif',
  SourceSerifPro: '"Source Serif 4", Georgia, serif',
  Manrope: 'Manrope, system-ui, sans-serif',
  IBMPlexSans: '"IBM Plex Sans", system-ui, sans-serif',
}

export function fontFamilyToCSS(family: FontFamily): string {
  return FONT_FAMILY_CSS[family]
}

export function layoutStylesToCSS(styles: LayoutStyles): CSSProperties {
  return {
    fontFamily: fontFamilyToCSS(styles.fontFamily),
    fontSize: `${styles.fontSize * PT_TO_PX}px`,
    fontWeight: styles.fontWeight,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing ? `${styles.letterSpacing}em` : undefined,
    textAlign: styles.textAlign,
    fontStyle: styles.fontStyle,
    textDecoration: styles.textDecoration,
    paddingTop: styles.paddingTopPt ? `${styles.paddingTopPt * PT_TO_PX}px` : undefined,
    paddingRight: styles.paddingRightPt ? `${styles.paddingRightPt * PT_TO_PX}px` : undefined,
    paddingBottom: styles.paddingBottomPt ? `${styles.paddingBottomPt * PT_TO_PX}px` : undefined,
    paddingLeft: styles.paddingLeftPt ? `${styles.paddingLeftPt * PT_TO_PX}px` : undefined,
  }
}

export function ptToPx(pt: number): number {
  return pt * PT_TO_PX
}
