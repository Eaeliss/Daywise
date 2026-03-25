import { useEffect } from 'react'
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

  useEffect(() => {
    if (!userId) return
    Promise.all([
      initCalendar(userId),
      initGoals(userId),
      initHabits(userId),
      initFinances(userId),
      initNotes(userId),
      initSavings(userId),
    ])
  }, [userId])
}
