import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/use-theme'

export default function ResetPasswordScreen() {
  const theme = useTheme()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpdatePassword() {
    if (password.trim().length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      // success: USER_UPDATED fires → _layout routes to dashboard
    } catch {
      setLoading(false)
      Alert.alert('Update failed', 'Password update failed. Please try again.')
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
          Set new password
        </Text>
        <Text style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 32 }}>
          Enter and confirm your new password.
        </Text>

        <TextInput
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
            fontSize: 15, color: theme.text, marginBottom: 12,
          }}
          placeholder="New password (min 8 characters)"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          testID="password-input"
        />
        <TextInput
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
            fontSize: 15, color: theme.text, marginBottom: 20,
          }}
          placeholder="Confirm new password"
          placeholderTextColor={theme.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          testID="confirm-password-input"
        />

        <Pressable
          onPress={handleUpdatePassword}
          disabled={loading}
          style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
          testID="update-button"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Update Password</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
