import type { LayoutStyles } from '@/shared/types/layout.types'
import type { FontFamily } from '@/shared/types/font.types'
import type { CSSProperties } from 'react'
import { PT_TO_PX } from './canvas.constants'

const FONT_FAMILY_CSS: Record<FontFamily, string> = {
  Inter: 'Inter, system-ui, sans-serif',
  SourceSerifPro: 'SourceSerifPro, Georgia, serif',
  Manrope: 'Manrope, system-ui, sans-serif',
  IBMPlexSans: 'IBMPlexSans, system-ui, sans-serif',
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
    // Not `textTransform`: the override pass rewrites `content` instead, so the
    // canvas and the PDF render the same string. Casing it again here would
    // double-apply for anything the pass already handled.
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
