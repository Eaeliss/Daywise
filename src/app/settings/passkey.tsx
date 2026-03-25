import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'
import { usePasskeyRegister } from '@/hooks/use-passkey'

export default function PasskeySettingsScreen() {
  const theme = useTheme()
  const { register, loading } = usePasskeyRegister()

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
        Passkey
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 32 }}>
        Use Face ID or fingerprint to sign in without a password.
      </Text>
      <Pressable
        onPress={register}
        disabled={loading}
        style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        testID="setup-passkey-button"
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Set up passkey</Text>
        }
      </Pressable>
    </View>
  )
}
