import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('preferences')

function load(key: string, fallback: string): string {
  return storage.getString(key) ?? fallback
}

function save(key: string, value: string) {
  storage.set(key, value)
}

export type ColorScheme = 'light' | 'dark' | 'system'

export interface PreferencesState {
  colorScheme: ColorScheme
  language: string
  currency: string
  notificationsEnabled: boolean
  habitReminderHour: number   // 0-23
  habitReminderMinute: number // 0-59
  setColorScheme: (scheme: ColorScheme) => void
  setLanguage: (lang: string) => void
  setCurrency: (currency: string) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setHabitReminderTime: (hour: number, minute: number) => void
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  colorScheme: load('colorScheme', 'system') as ColorScheme,
  language: load('language', 'en'),
  currency: load('currency', 'USD'),
  notificationsEnabled: storage.getBoolean('notificationsEnabled') ?? false,
  habitReminderHour: parseInt(load('habitReminderHour', '20'), 10),
  habitReminderMinute: parseInt(load('habitReminderMinute', '0'), 10),

  setColorScheme: (colorScheme) => {
    if (colorScheme === get().colorScheme) return
    save('colorScheme', colorScheme)
    set({ colorScheme })
  },
  setLanguage: (language) => {
    if (language === get().language) return
    save('language', language)
    set({ language })
  },
  setCurrency: (currency) => {
    if (currency === get().currency) return
    save('currency', currency)
    set({ currency })
  },
  setNotificationsEnabled: (enabled) => {
    storage.set('notificationsEnabled', enabled)
    set({ notificationsEnabled: enabled })
  },
  setHabitReminderTime: (hour, minute) => {
    save('habitReminderHour', String(hour))
    save('habitReminderMinute', String(minute))
    set({ habitReminderHour: hour, habitReminderMinute: minute })
  },
}))
