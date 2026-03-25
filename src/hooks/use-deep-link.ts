import { useEffect } from 'react'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'

// P-01: detectSessionInUrl is false in supabase.ts (required for React Native — the SDK cannot
// read window.location). We must manually forward deep-link URLs to the SDK so it can extract
// auth tokens and fire the appropriate onAuthStateChange events (e.g. PASSWORD_RECOVERY).
async function handleDeepLink(url: string) {
  const fragment = url.split('#')[1]
  if (!fragment) return

  const params = new URLSearchParams(fragment)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return

  await supabase.auth.setSession({ access_token, refresh_token })
  // SDK fires PASSWORD_RECOVERY (type=recovery) or SIGNED_IN → onAuthStateChange in use-auth.ts picks it up
}

export function useDeepLink() {
  useEffect(() => {
    // Cold-start: app launched via deep link — getInitialURL returns the launch URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })

    // Foreground: app already running, receives a new deep link
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url))

    return () => subscription.remove()
  }, [])
}
