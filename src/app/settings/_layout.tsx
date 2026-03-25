import { Stack, router } from 'expo-router'
import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/use-theme'

export default function SettingsLayout() {
  const theme = useTheme()

  const screenOptions = {
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.text,
    headerShadowVisible: false,
    headerLeft: () => (
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 8, marginLeft: -4 }}>
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>
    ),
  }

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="preferences" options={{ title: 'Preferences' }} />
      <Stack.Screen name="passkey" options={{ title: 'Passkey' }} />
      <Stack.Screen name="sessions" options={{ title: 'Active Sessions' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete Account' }} />
    </Stack>
  )
}
