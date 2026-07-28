import { theme as antdTheme, type ThemeConfig } from 'antd'
import { AVAILABLE_THEMES } from '@/shared/stores/theme.store'
import type { ThemeColors } from '@/shared/types/theme.types'

const lightColors = AVAILABLE_THEMES.find((t) => t.id === 'light')!.colors
const darkColors = AVAILABLE_THEMES.find((t) => t.id === 'dark')!.colors

// The app chrome's brand accent (violet), kept separate from lightColors/
// darkColors.primary — those Theme objects double as resume color presets,
// and antd's colorPrimary drives every primary Button/Checkbox/etc. across
// the app, not resume content. Must stay in sync with tokens.css's
// --color-primary/-hover/-active (":root" / "[data-theme='dark']").
const APP_BRAND_PRIMARY = {
  light: { primary: '#7c3aed', hover: '#6d28d9', active: '#5b21b6' },
  dark: { primary: '#8b5cf6', hover: '#7c3aed', active: '#6d28d9' },
}

/** Maps the app chrome's light/dark palette onto antd's ConfigProvider tokens. */
function toAntdTokens(colors: ThemeColors, brandPrimary: typeof APP_BRAND_PRIMARY.light): ThemeConfig['token'] {
  return {
    colorPrimary: brandPrimary.primary,
    colorPrimaryHover: brandPrimary.hover,
    colorPrimaryActive: brandPrimary.active,
    colorBgLayout: colors.background,
    colorBgContainer: colors.surface,
    colorBgElevated: colors.surfaceElevated,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textMuted,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    colorBorder: colors.divider,
    colorBorderSecondary: colors.divider,
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    fontFamily: "Inter, system-ui, sans-serif",
    // The original (pre-antd) design used 40px as its default control height
    // (Tailwind's h-10) for Button/Input/Select, with 32/48px sm/lg variants.
    // antd's own seed default is controlHeight: 32, one tier smaller — every
    // control in the app rendered visibly smaller/cramped than intended until
    // this was corrected. antd derives controlHeightSM/LG from this as
    // controlHeight * 0.75 / * 1.25, so bumping just the base restores the
    // original 40px default (and proportionally scales small/large) without
    // needing to touch every component's own `size` prop.
    controlHeight: 40,
  }
}

/** Builds the antd ConfigProvider theme config for the app's UI chrome (not resume color presets). */
export function getAntdThemeConfig(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: toAntdTokens(
      isDark ? darkColors : lightColors,
      isDark ? APP_BRAND_PRIMARY.dark : APP_BRAND_PRIMARY.light
    ),
  }
}
