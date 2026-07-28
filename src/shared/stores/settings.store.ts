import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  pageSize: 'A4' | 'LETTER'
  language: string
}

interface SettingsActions {
  setPageSize(size: 'A4' | 'LETTER'): void
  setLanguage(lang: string): void
}

type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      pageSize: 'A4',
      language: 'en',

      setPageSize(size) {
        set({ pageSize: size })
      },

      setLanguage(lang) {
        set({ language: lang })
      },
    }),
    {
      name: 'resume-studio-settings',
    }
  )
)
