import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { isValidEmail } from '@/lib/validation'
import { useTheme } from '@/hooks/use-theme'

export default function SignUpScreen() {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert('Registration failed', error.message)
      return
    }

    // Email confirmation required — session is null until user confirms
    if (!data.session) {
      Alert.alert('Check your email', 'We sent you a confirmation link. Click it to activate your account.')
      router.replace('/auth/sign-in')
    }
    // If email confirmation is disabled, onAuthStateChange fires SIGNED_IN and _layout redirects automatically
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
          Create account
        </Text>
        <Text style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 32 }}>
          Sign up to get started
        </Text>

        <TextInput
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
            fontSize: 15, color: theme.text, marginBottom: 12,
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
        <TextInput
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
            fontSize: 15, color: theme.text, marginBottom: 20,
          }}
          placeholder="Password (min 8 characters)"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          testID="password-input"
        />

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 20, opacity: loading ? 0.6 : 1 }}
          testID="register-button"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Register</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/sign-in')} testID="sign-in-link">
          <Text style={{ textAlign: 'center', color: '#3b82f6' }}>Already have an account? Sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
