import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'
import { useDeleteAccount } from '@/hooks/use-delete-account'

export default function DeleteAccountScreen() {
  const theme = useTheme()
  const [password, setPassword] = useState('')
  const { deleteAccount, loading } = useDeleteAccount()

  async function handleDelete() {
    if (!password) return
    await deleteAccount(password)
    Alert.alert('Deletion failed', 'Please check your password and try again.')
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
        Delete account
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 32 }}>
        This action is permanent and cannot be undone. All your data will be deleted.
      </Text>
      <TextInput
        style={{
          backgroundColor: theme.backgroundElement,
          borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
          fontSize: 15, color: theme.text, marginBottom: 20,
        }}
        placeholder="Confirm your password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        testID="confirm-password-input"
      />
      <Pressable
        onPress={handleDelete}
        disabled={loading}
        style={{ borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        testID="delete-account-button"
      >
        {loading
          ? <ActivityIndicator color="#ef4444" />
          : <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 15 }}>Delete my account</Text>
        }
      </Pressable>
    </View>
  )
}
