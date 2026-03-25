import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const setSession = useAuthStore((s) => s.setSession)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const setPasswordRecovery = useAuthStore((s) => s.setPasswordRecovery)
  const session = useAuthStore((s) => s.session)
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const isPasswordRecovery = useAuthStore((s) => s.isPasswordRecovery)

  useEffect(() => {
    // Fallback: explicitly fetch session so initialized is guaranteed to be set
    // even if onAuthStateChange does not fire INITIAL_SESSION (e.g. on web).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'INITIAL_SESSION') {
        setInitialized(true)
      }
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
      if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        setPasswordRecovery(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // run once on mount — store setters are stable Zustand references

  return { session, user, initialized, isPasswordRecovery }
}
