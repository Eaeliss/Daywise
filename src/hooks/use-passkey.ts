import { useState } from 'react'
import { Passkey } from 'react-native-passkey'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

async function callEdgeFunction(path: string, body: object, authToken?: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Edge function error: ${res.status}`)
  return res.json()
}

export function usePasskeyRegister() {
  const [loading, setLoading] = useState(false)

  async function register() {
    setLoading(true)
    try {
      // Check support first — simulators and old devices may not support passkeys
      if (!(await Passkey.isSupported())) return

      const session = (await supabase.auth.getSession()).data.session
      if (!session) return // must be signed in to register

      // 1. Get registration options from server (challenge stored server-side)
      const options = await callEdgeFunction(
        'webauthn-challenge',
        { type: 'registration', userId: session.user.id },
        session.access_token,
      )

      // 2. Create credential on device (triggers biometric prompt)
      const response = await Passkey.create(options)

      // 3. Verify with server and store credential
      await callEdgeFunction(
        'webauthn-verify',
        { type: 'registration', response, userId: session.user.id },
        session.access_token,
      )
    } catch {
      // Cancellation, biometric failure, or network error — all silent (AC3)
    } finally {
      setLoading(false)
    }
  }

  return { register, loading }
}

export function usePasskeySignIn() {
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)
    try {
      // Check support first
      if (!(await Passkey.isSupported())) return

      // 1. Get authentication options from server (no auth token needed — pre-auth endpoint)
      const options = await callEdgeFunction('webauthn-challenge', { type: 'authentication' })

      // 2. Get credential from device (triggers biometric prompt)
      const response = await Passkey.get(options)

      // 3. Verify with server — returns a custom JWT signed with SUPABASE_JWT_SECRET
      const { access_token } = await callEdgeFunction('webauthn-verify', {
        type: 'authentication',
        response,
      })

      if (!access_token) return

      // 4. Establish Supabase session (same pattern as Story 1.4 Google OAuth)
      // Note: custom JWTs are not auto-refreshable by Supabase (no refresh_token)
      await supabase.auth.setSession({ access_token, refresh_token: '' })
      // onAuthStateChange('SIGNED_IN') → use-auth.ts → _layout.tsx routes to /(tabs)/dashboard
    } catch {
      // Cancellation, biometric failure, or network error — all silent (AC3)
    } finally {
      setLoading(false)
    }
  }

  return { signIn, loading }
}
