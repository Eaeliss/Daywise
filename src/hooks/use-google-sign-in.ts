import { useState } from 'react'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'

// Required on iOS: closes the SFSafariViewController tab after redirect
WebBrowser.maybeCompleteAuthSession()

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    const redirectTo = AuthSession.makeRedirectUri({
      scheme: 'lifeplanapp',
      path: 'auth/callback',
    })

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (error || !data.url) {
        // Treat as cancellation per AC3 — no user-visible error
        return
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

      if (result.type !== 'success') {
        // User cancelled — return silently (AC3)
        return
      }

      const fragment = result.url.split('#')[1] ?? ''
      const params = new URLSearchParams(fragment)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (!access_token || !refresh_token) {
        // Malformed redirect — logging sufficient, return silently
        return
      }

      await supabase.auth.setSession({ access_token, refresh_token })
      // onAuthStateChange('SIGNED_IN') fires → use-auth.ts → _layout.tsx routes to /(tabs)/dashboard
    } finally {
      setLoading(false)
    }
  }

  return { signInWithGoogle, loading }
}
