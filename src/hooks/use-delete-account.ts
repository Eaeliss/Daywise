import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

async function callEdgeFunction(path: string, body: object, authToken: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Edge function error: ${res.status}`)
  return res.json()
}

export function useDeleteAccount() {
  const [loading, setLoading] = useState(false)

  async function deleteAccount(password: string) {
    setLoading(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session?.user?.email) return

      // Step 1: Verify password via re-auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password,
      })
      if (authError) return // wrong password — generic alert shown in UI

      // Step 2: Delete account via Edge Function (requires service role)
      await callEdgeFunction('delete-account', {}, session.access_token)

      // Step 3: Sign out locally
      await supabase.auth.signOut()
      // onAuthStateChange('SIGNED_OUT') → _layout.tsx → /auth/sign-in
    } catch {
      // network/server error — silent (loading resets via finally)
    } finally {
      setLoading(false)
    }
  }

  return { deleteAccount, loading }
}
