import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AuthState {
  session: Session | null
  user: User | null
  initialized: boolean
  isPasswordRecovery: boolean
  setSession: (session: Session | null) => void
  setInitialized: (initialized: boolean) => void
  setPasswordRecovery: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  isPasswordRecovery: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setInitialized: (initialized) => set({ initialized }),
  setPasswordRecovery: (isPasswordRecovery) => set({ isPasswordRecovery }),
}))
