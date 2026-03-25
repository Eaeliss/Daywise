import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { isValidEmail } from '@/lib/validation'
import { useTheme } from '@/hooks/use-theme'

export default function ForgotPasswordScreen() {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendResetEmail() {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'lifeplanapp://auth/reset-password',
      })
    } catch {
      // Suppress thrown exception — same message for all outcomes
    }
    setLoading(false)

    Alert.alert(
      'Email sent',
      'If an account exists for that email, you will receive a reset link shortly.',
      [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }],
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
          Reset password
        </Text>
        <Text style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 32 }}>
          Enter your email address and we'll send you a reset link.
        </Text>

        <TextInput
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
            fontSize: 15, color: theme.text, marginBottom: 20,
          }}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          testID="email-input"
        />

        <Pressable
          onPress={handleSendResetEmail}
          disabled={loading}
          style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 20, opacity: loading ? 0.6 : 1 }}
          testID="send-button"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Send Reset Email</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/sign-in')} testID="sign-in-link">
          <Text style={{ textAlign: 'center', color: '#3b82f6' }}>Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
