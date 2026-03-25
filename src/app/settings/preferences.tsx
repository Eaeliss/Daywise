import { Alert, ScrollView, Switch, Text, Pressable, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'
import { usePreferencesStore, ColorScheme } from '@/stores/preferences-store'
import {
  requestNotificationPermission,
  scheduleDailyHabitReminder,
  cancelHabitReminder,
} from '@/utils/notifications'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'Hebrew' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
]

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'ILS', label: 'ILS — Israeli Shekel' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
  { code: 'MXN', label: 'MXN — Mexican Peso' },
]

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System default' },
]

const REMINDER_HOURS = [
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '8:00 PM', hour: 20, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
  { label: '10:00 PM', hour: 22, minute: 0 },
]

export default function PreferencesScreen() {
  const theme = useTheme()
  const {
    colorScheme, language, currency, notificationsEnabled, habitReminderHour, habitReminderMinute,
    setColorScheme, setLanguage, setCurrency, setNotificationsEnabled, setHabitReminderTime,
  } = usePreferencesStore()

  async function handleToggleNotifications(enabled: boolean) {
    if (enabled) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        Alert.alert('Permission required', 'Please allow notifications in your device settings.')
        return
      }
      await scheduleDailyHabitReminder(habitReminderHour, habitReminderMinute)
    } else {
      await cancelHabitReminder()
    }
    setNotificationsEnabled(enabled)
  }

  async function handleReminderTime(hour: number, minute: number) {
    setHabitReminderTime(hour, minute)
    if (notificationsEnabled) {
      await scheduleDailyHabitReminder(hour, minute)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      <SectionTitle label="Appearance" theme={theme} />
      <OptionGroup theme={theme}>
        {COLOR_SCHEMES.map((s, i) => (
          <OptionRow
            key={s.value}
            label={s.label}
            selected={colorScheme === s.value}
            onPress={() => setColorScheme(s.value)}
            isLast={i === COLOR_SCHEMES.length - 1}
            theme={theme}
          />
        ))}
      </OptionGroup>

      <SectionTitle label="Language" theme={theme} />
      <OptionGroup theme={theme}>
        {LANGUAGES.map((l, i) => (
          <OptionRow
            key={l.code}
            label={l.label}
            selected={language === l.code}
            onPress={() => setLanguage(l.code)}
            isLast={i === LANGUAGES.length - 1}
            theme={theme}
          />
        ))}
      </OptionGroup>

      <SectionTitle label="Currency" theme={theme} />
      <OptionGroup theme={theme}>
        {CURRENCIES.map((c, i) => (
          <OptionRow
            key={c.code}
            label={c.label}
            selected={currency === c.code}
            onPress={() => setCurrency(c.code)}
            isLast={i === CURRENCIES.length - 1}
            theme={theme}
          />
        ))}
      </OptionGroup>

      <SectionTitle label="Notifications" theme={theme} />
      <OptionGroup theme={theme}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: notificationsEnabled ? 1 : 0,
          borderBottomColor: theme.backgroundSelected,
        }}>
          <Text style={{ fontSize: 15, color: theme.text }}>Daily habit reminder</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.backgroundSelected, true: '#3b82f6' }}
            thumbColor="#fff"
          />
        </View>
        {notificationsEnabled && REMINDER_HOURS.map((r, i) => (
          <OptionRow
            key={`${r.hour}:${r.minute}`}
            label={r.label}
            selected={habitReminderHour === r.hour && habitReminderMinute === r.minute}
            onPress={() => handleReminderTime(r.hour, r.minute)}
            isLast={i === REMINDER_HOURS.length - 1}
            theme={theme}
          />
        ))}
      </OptionGroup>
    </ScrollView>
  )
}

function SectionTitle({ label, theme }: { label: string; theme: ReturnType<typeof import('@/hooks/use-theme').useTheme> }) {
  return (
    <Text style={{
      fontSize: 12, fontWeight: '600', color: theme.textSecondary,
      letterSpacing: 0.5, marginTop: 24, marginBottom: 8, paddingHorizontal: 4,
    }}>
      {label.toUpperCase()}
    </Text>
  )
}

function OptionGroup({ theme, children }: { theme: ReturnType<typeof import('@/hooks/use-theme').useTheme>; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
      {children}
    </View>
  )
}

function OptionRow({ label, selected, onPress, isLast, theme }: {
  label: string; selected: boolean; onPress: () => void
  isLast: boolean; theme: ReturnType<typeof import('@/hooks/use-theme').useTheme>
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.backgroundSelected,
      }}
    >
      <Text style={{ fontSize: 15, color: selected ? '#3b82f6' : theme.text, fontWeight: selected ? '600' : '400' }}>
        {label}
      </Text>
      {selected && <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '700' }}>✓</Text>}
    </Pressable>
  )
}
