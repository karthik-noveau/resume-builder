export interface ThemeColors {
  primary: string
  primaryHover: string
  primaryActive: string
  background: string
  surface: string
  surfaceElevated: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  warning: string
  error: string
  info: string
  accent: string
  divider: string
}

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
}
