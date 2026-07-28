import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore, AVAILABLE_THEMES, AVAILABLE_FONT_PRESETS } from './theme.store'

function resetStore() {
  useThemeStore.setState({
    activeThemeId: 'light',
    activeFontPresetId: 'professional',
    availableThemes: AVAILABLE_THEMES,
    availableFontPresets: AVAILABLE_FONT_PRESETS,
  })
}

describe('themeStore', () => {
  beforeEach(resetStore)

  it('starts with light theme', () => {
    expect(useThemeStore.getState().activeThemeId).toBe('light')
  })

  it('switches to dark theme', () => {
    useThemeStore.getState().switchTheme('dark')
    expect(useThemeStore.getState().activeThemeId).toBe('dark')
  })

  it('ignores unknown theme id', () => {
    useThemeStore.getState().switchTheme('nonexistent')
    expect(useThemeStore.getState().activeThemeId).toBe('light')
  })

  it('switches font preset', () => {
    useThemeStore.getState().switchFontPreset('modern')
    expect(useThemeStore.getState().activeFontPresetId).toBe('modern')
  })

  it('ignores unknown font preset id', () => {
    useThemeStore.getState().switchFontPreset('nonexistent')
    expect(useThemeStore.getState().activeFontPresetId).toBe('professional')
  })

  it('getActiveTheme returns correct theme', () => {
    useThemeStore.getState().switchTheme('dark')
    const theme = useThemeStore.getState().getActiveTheme()
    expect(theme.id).toBe('dark')
    expect(theme.name).toBe('Dark')
  })

  it('getActiveFontPreset returns correct preset', () => {
    useThemeStore.getState().switchFontPreset('executive')
    const preset = useThemeStore.getState().getActiveFontPreset()
    expect(preset.id).toBe('executive')
    expect(preset.headingFamily).toBe('SourceSerifPro')
  })

  it('exposes all 2 themes', () => {
    expect(useThemeStore.getState().availableThemes).toHaveLength(2)
  })

  it('exposes all 4 font presets', () => {
    expect(useThemeStore.getState().availableFontPresets).toHaveLength(4)
  })
})
