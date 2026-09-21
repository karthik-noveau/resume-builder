import type { ThemeColors } from '@/shared/types/theme.types'

/** Interface colors, independent of the color presets used to render resumes.
 * Keep the CSS fallbacks in styles/tokens.css aligned with these palettes. */
export const APP_THEME_COLORS: Record<'light' | 'dark', ThemeColors> = {
  light: {
    primary: '#7a45d1',
    primaryHover: '#6836bc',
    primaryActive: '#592ca7',
    background: '#f8f7fd',
    surface: '#ffffff',
    surfaceElevated: '#f3f0fb',
    textPrimary: '#1e1a34',
    textSecondary: '#585772',
    textMuted: '#68657e',
    success: '#208475',
    warning: '#b77916',
    error: '#dc454f',
    info: '#4c79d1',
    accent: '#5362d8',
    divider: '#e3dff0',
  },
  dark: {
    primary: '#ad88f2',
    primaryHover: '#bd9bf8',
    primaryActive: '#9973e2',
    background: '#141221',
    surface: '#1e1b30',
    surfaceElevated: '#29253e',
    textPrimary: '#f3effc',
    textSecondary: '#cec7e2',
    textMuted: '#aaa1bf',
    success: '#72cbb2',
    warning: '#e8b665',
    error: '#f28a92',
    info: '#91b0f0',
    accent: '#99a4fa',
    divider: '#3c3553',
  },
}
