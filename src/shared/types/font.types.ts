export type FontFamily = 'Inter' | 'SourceSerifPro' | 'Manrope' | 'IBMPlexSans'

export type FontWeight = 400 | 500 | 600 | 700 | 800

export interface FontScale {
  name: number
  headline: number
  sectionTitle: number
  entryTitle: number
  body: number
  small: number
  caption: number
}

export interface FontLineHeight {
  heading: number
  body: number
}

export interface FontLetterSpacing {
  heading: number
  body: number
}

export interface FontPreset {
  id: string
  name: string
  headingFamily: FontFamily
  bodyFamily: FontFamily
  scale: FontScale
  lineHeight: FontLineHeight
  letterSpacing: FontLetterSpacing
}
