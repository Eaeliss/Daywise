import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useCalendarStore } from '@/stores/calendar-store'
import { useGoalsStore } from '@/stores/goals-store'
import { useHabitsStore } from '@/stores/habits-store'
import { useFinancesStore } from '@/stores/finances-store'
import { useNotesStore } from '@/stores/notes-store'
import { useSavingsStore } from '@/stores/savings-store'

export function useInitStores(userId: string | null) {
  const initCalendar = useCalendarStore((s) => s.init)
  const initGoals = useGoalsStore((s) => s.init)
  const initHabits = useHabitsStore((s) => s.init)
  const initFinances = useFinancesStore((s) => s.init)
  const initNotes = useNotesStore((s) => s.init)
  const initSavings = useSavingsStore((s) => s.init)

  const resetCalendar = useCalendarStore((s) => s.reset)
  const resetGoals = useGoalsStore((s) => s.reset)
  const resetHabits = useHabitsStore((s) => s.reset)
  const resetNotes = useNotesStore((s) => s.reset)
  const resetSavings = useSavingsStore((s) => s.reset)
  const resetFinances = useFinancesStore((s) => s.signOut)

  const userIdRef = useRef(userId)
  userIdRef.current = userId

  function runInit(uid: string) {
    return Promise.all([
      initCalendar(uid),
      initGoals(uid),
      initHabits(uid),
      initFinances(uid),
      initNotes(uid),
      initSavings(uid),
    ])
  }

  function resetAll() {
    resetCalendar()
    resetGoals()
    resetHabits()
    resetNotes()
    resetSavings()
    resetFinances()
  }

  // Init / reset based on auth state
  useEffect(() => {
    if (!userId) {
      resetAll()
      return
    }
    runInit(userId)
  }, [userId])

  // Re-sync from Supabase when app comes back to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && userIdRef.current) {
        runInit(userIdRef.current)
      }
    }
    const sub = AppState.addEventListener('change', handleAppState)
    return () => sub.remove()
  }, [])
}
