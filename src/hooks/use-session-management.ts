import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Session = {
  id: string
  user_agent: string | null
  created_at: string
  updated_at: string
}

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

export function useSessionList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  async function refetch() {
    setLoading(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return
      const data = await callEdgeFunction('list-sessions', {}, session.access_token)
      setSessions(data ?? [])
    } catch {
      // network error — silent
    } finally {
      setLoading(false)
    }
  }

  return { sessions, loading, refetch }
}

export function useSignOut() {
  const [loading, setLoading] = useState(false)

  async function signOut() {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      // onAuthStateChange('SIGNED_OUT') → _layout.tsx handles routing
    } finally {
      setLoading(false)
    }
  }

  return { signOut, loading }
}

export function useSignOutOtherSessions() {
  const [loading, setLoading] = useState(false)

  async function signOutOthers() {
    setLoading(true)
    try {
      await supabase.auth.signOut({ scope: 'others' })
    } finally {
      setLoading(false)
    }
  }

  return { signOutOthers, loading }
}

export function useRevokeSession() {
  const [loading, setLoading] = useState(false)

  async function revokeSession(sessionId: string) {
    setLoading(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return
      await callEdgeFunction('list-sessions', { action: 'revoke', sessionId }, session.access_token)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return { revokeSession, loading }
}
