import { theme as antdTheme, type ThemeConfig } from 'antd'
import { APP_THEME_COLORS } from '@/shared/theme/appTheme'
import type { ThemeColors } from '@/shared/types/theme.types'

/** Maps the app chrome's light/dark palette onto antd's ConfigProvider tokens. */
function toAntdTokens(colors: ThemeColors): ThemeConfig['token'] {
  return {
    colorPrimary: colors.primary,
    colorPrimaryHover: colors.primaryHover,
    colorPrimaryActive: colors.primaryActive,
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
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    fontFamily: 'Inter, system-ui, sans-serif',
    // 13px to match the app's own --text-base. antd defaults to 14, which left
    // every antd control a step larger than the CSS-module controls beside it.
    fontSize: 13,
    // 32px, matching --control-md. This was 40 (Tailwind's h-10, inherited from
    // the pre-antd design) — a reading-sized control in a dense editor, and the
    // reason a select and a number input sharing one grid row measured 40px and
    // 37px. antd derives SM/LG from this as *0.75 / *1.25, so the whole family
    // moves together. Anything that genuinely needs the old height should ask
    // for size="large" rather than raising the default for everything.
    controlHeight: 32,
  }
}

/** Builds the antd ConfigProvider theme config for the app's UI chrome (not resume color presets). */
export function getAntdThemeConfig(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: toAntdTokens(APP_THEME_COLORS[isDark ? 'dark' : 'light']),
  }
}
