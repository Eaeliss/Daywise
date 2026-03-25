import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { isValidEmail } from '@/lib/validation'
import { useGoogleSignIn } from '@/hooks/use-google-sign-in'
import { usePasskeySignIn } from '@/hooks/use-passkey'
import { useTheme } from '@/hooks/use-theme'

export default function SignInScreen() {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn()
  const { signIn: signInWithPasskey, loading: passkeyLoading } = usePasskeySignIn()

  async function handleSignIn() {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid input', 'Please enter a valid email address.')
      return
    }
    if (!password) {
      Alert.alert('Invalid input', 'Please enter your password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      setPassword('')
      Alert.alert('Sign in failed', 'Email or password is incorrect.')
      return
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
          Welcome back
        </Text>
        <Text style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 32 }}>
          Sign in to your account
        </Text>

        <TextInput
          style={{
            borderWidth: 1, borderColor: theme.backgroundElement,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
            fontSize: 15, color: theme.text, marginBottom: 12,
            backgroundColor: theme.backgroundElement,
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
            borderWidth: 1, borderColor: theme.backgroundElement,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
            fontSize: 15, color: theme.text, marginBottom: 20,
            backgroundColor: theme.backgroundElement,
          }}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          testID="password-input"
        />

        <Pressable
          onPress={handleSignIn}
          disabled={loading}
          style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12, opacity: loading ? 0.6 : 1 }}
          testID="sign-in-button"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Sign In</Text>
          }
        </Pressable>

        <Text style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 12 }}>or</Text>

        <Pressable
          onPress={signInWithGoogle}
          disabled={googleLoading}
          style={{ borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 12, opacity: googleLoading ? 0.6 : 1 }}
          testID="google-sign-in-button"
        >
          {googleLoading
            ? <ActivityIndicator color="#3b82f6" />
            : <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>Sign in with Google</Text>
          }
        </Pressable>

        <Text style={{ textAlign: 'center', color: theme.textSecondary, marginVertical: 12 }}>or</Text>

        <Pressable
          onPress={signInWithPasskey}
          disabled={passkeyLoading}
          style={{ borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 20, opacity: passkeyLoading ? 0.6 : 1 }}
          testID="passkey-sign-in-button"
        >
          {passkeyLoading
            ? <ActivityIndicator color="#3b82f6" />
            : <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>Sign in with passkey</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/forgot-password')} testID="forgot-password-link">
          <Text style={{ textAlign: 'center', color: '#3b82f6', marginBottom: 12 }}>Forgot password?</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/sign-up')} testID="sign-up-link">
          <Text style={{ textAlign: 'center', color: '#3b82f6' }}>Don't have an account? Register</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
