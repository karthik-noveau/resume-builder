import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, ThemeColors } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'

// ─── Theme Definitions ───────────────────────────────────────────────────────

const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryActive: '#1e40af',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0ea5e9',
    accent: '#2563eb',
    divider: '#e2e8f0',
  },
}

const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
    background: '#0f0f1f',
    surface: '#1a1a33',
    surfaceElevated: '#24244a',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#38bdf8',
    accent: '#3b82f6',
    divider: '#2e2e52',
  },
}

export const AVAILABLE_THEMES: Theme[] = [lightTheme, darkTheme]

export const CUSTOM_THEME_ID = 'custom'
export const DEFAULT_CUSTOM_PRIMARY_COLOR = '#2563eb'

/** Shifts a hex color's channels by `percent` (negative darkens, positive lightens). */
export function tintColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const clamp = (v: number) => Math.min(255, Math.max(0, v))
  const r = clamp(((num >> 16) & 0xff) + Math.round(255 * percent))
  const g = clamp(((num >> 8) & 0xff) + Math.round(255 * percent))
  const b = clamp((num & 0xff) + Math.round(255 * percent))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/** Builds a one-off Theme from a user-picked accent color, based on the light palette. */
export function buildCustomTheme(primaryColor: string): Theme {
  return {
    id: CUSTOM_THEME_ID,
    name: 'Custom',
    colors: {
      ...lightTheme.colors,
      primary: primaryColor,
      primaryHover: tintColor(primaryColor, -0.15),
      primaryActive: tintColor(primaryColor, -0.3),
      accent: primaryColor,
    },
  }
}

/** Resolves the Theme a resume should render with, honoring a custom accent color when set. */
export function resolveResumeTheme(themeId: string, customPrimaryColor?: string): Theme {
  if (themeId === CUSTOM_THEME_ID) {
    return buildCustomTheme(customPrimaryColor || DEFAULT_CUSTOM_PRIMARY_COLOR)
  }
  return AVAILABLE_THEMES.find((t) => t.id === themeId) ?? lightTheme
}

// ─── Font Preset Definitions ─────────────────────────────────────────────────

export const AVAILABLE_FONT_PRESETS: FontPreset[] = [
  {
    id: 'professional',
    name: 'Professional',
    headingFamily: 'Inter',
    bodyFamily: 'Inter',
    scale: { name: 24, headline: 14, sectionTitle: 12, entryTitle: 11, body: 10, small: 9, caption: 8 },
    lineHeight: { heading: 1.2, body: 1.5 },
    letterSpacing: { heading: -0.02, body: 0 },
  },
  {
    id: 'executive',
    name: 'Executive',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'SourceSerifPro',
    scale: { name: 28, headline: 15, sectionTitle: 13, entryTitle: 12, body: 11, small: 10, caption: 9 },
    lineHeight: { heading: 1.2, body: 1.6 },
    letterSpacing: { heading: -0.01, body: 0.01 },
  },
  {
    id: 'modern',
    name: 'Modern',
    headingFamily: 'Manrope',
    bodyFamily: 'Manrope',
    scale: { name: 32, headline: 16, sectionTitle: 13, entryTitle: 12, body: 10, small: 9, caption: 8 },
    lineHeight: { heading: 1.1, body: 1.5 },
    letterSpacing: { heading: -0.03, body: 0 },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    headingFamily: 'IBMPlexSans',
    bodyFamily: 'IBMPlexSans',
    scale: { name: 22, headline: 14, sectionTitle: 11, entryTitle: 11, body: 10, small: 9, caption: 8 },
    lineHeight: { heading: 1.3, body: 1.6 },
    letterSpacing: { heading: 0, body: 0.01 },
  },
]

// ─── Theme Application ────────────────────────────────────────────────────────

// primary/primaryHover/primaryActive/accent are deliberately excluded here.
// AVAILABLE_THEMES doubles as the set of resume color presets, so syncing
// its primary color onto the app chrome's CSS vars would mean rebranding
// the web app also silently changed every future resume's default accent
// color. tokens.css defines --color-primary/-hover/-active/--color-accent
// as static, independent values (one set under `:root`, one under
// `[data-theme='dark']`) — setting `data-theme` below is enough for the
// cascade to pick the right one; this map just doesn't touch them.
const COLOR_KEY_TO_CSS_VAR: Partial<Record<keyof ThemeColors, string>> = {
  background: '--color-background',
  surface: '--color-surface',
  surfaceElevated: '--color-surface-elevated',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textMuted: '--color-text-muted',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',
  divider: '--color-divider',
}

/** Converts a hex color to a space-separated "R G B" triplet — the format
 * tokens.css uses so Tailwind's opacity modifiers (bg-primary/10, etc.) can
 * build `rgb(var(--x) / <alpha-value>)`. A plain hex value in the CSS
 * variable breaks every `/opacity` utility across the app. */
function hexToRgbTriplet(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return `${r} ${g} ${b}`
}

function applyThemeToDom(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme.id)
  for (const [key, cssVar] of Object.entries(COLOR_KEY_TO_CSS_VAR)) {
    if (!cssVar) continue
    const color = theme.colors[key as keyof ThemeColors]
    root.style.setProperty(cssVar, hexToRgbTriplet(color))
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface ThemeState {
  activeThemeId: string
  activeFontPresetId: string
  availableThemes: Theme[]
  availableFontPresets: FontPreset[]
}

interface ThemeActions {
  switchTheme(themeId: string): void
  switchFontPreset(presetId: string): void
  applyActiveTheme(): void
  getActiveTheme(): Theme
  getActiveFontPreset(): FontPreset
  getThemeById(themeId: string): Theme
  getFontPresetById(presetId: string): FontPreset
}

type ThemeStore = ThemeState & ThemeActions

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // ─── State ──────────────────────────────────────────────────────────────
      activeThemeId: 'light',
      activeFontPresetId: 'professional',
      availableThemes: AVAILABLE_THEMES,
      availableFontPresets: AVAILABLE_FONT_PRESETS,

      // ─── Actions ────────────────────────────────────────────────────────────
      switchTheme(themeId) {
        const theme = AVAILABLE_THEMES.find((t) => t.id === themeId)
        if (!theme) return
        set({ activeThemeId: themeId })
        applyThemeToDom(theme)
      },

      switchFontPreset(presetId) {
        const preset = AVAILABLE_FONT_PRESETS.find((p) => p.id === presetId)
        if (!preset) return
        set({ activeFontPresetId: presetId })
      },

      applyActiveTheme() {
        const theme = AVAILABLE_THEMES.find((t) => t.id === get().activeThemeId) ?? lightTheme
        applyThemeToDom(theme)
      },

      getActiveTheme() {
        return AVAILABLE_THEMES.find((t) => t.id === get().activeThemeId) ?? lightTheme
      },

      getActiveFontPreset() {
        return (
          AVAILABLE_FONT_PRESETS.find((p) => p.id === get().activeFontPresetId) ??
          AVAILABLE_FONT_PRESETS[0]
        )
      },

      getThemeById(themeId) {
        return AVAILABLE_THEMES.find((t) => t.id === themeId) ?? lightTheme
      },

      getFontPresetById(presetId) {
        return AVAILABLE_FONT_PRESETS.find((p) => p.id === presetId) ?? AVAILABLE_FONT_PRESETS[0]
      },
    }),
    {
      name: 'resume-studio-theme',
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        activeFontPresetId: state.activeFontPresetId,
      }),
    }
  )
)
