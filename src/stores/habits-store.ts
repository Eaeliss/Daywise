import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('habits')

export type Habit = {
  id: string
  title: string
  color: string
  createdAt: string // YYYY-MM-DD
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#10b981']

type HabitsState = {
  habits: Habit[]
  // completions: { [habitId]: Set of YYYY-MM-DD strings } stored as { [habitId]: string[] }
  completions: Record<string, string[]>
  addHabit: (title: string, color?: string) => void
  renameHabit: (id: string, title: string, color?: string) => void
  removeHabit: (id: string) => void
  toggleCompletion: (habitId: string, date: string) => void
}

function loadHabits(): Habit[] {
  const raw = storage.getString('habits')
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function loadCompletions(): Record<string, string[]> {
  const raw = storage.getString('completions')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function saveHabits(habits: Habit[]) {
  storage.set('habits', JSON.stringify(habits))
}

function saveCompletions(completions: Record<string, string[]>) {
  storage.set('completions', JSON.stringify(completions))
}

function getStreak(dates: string[], today: string): number {
  const set = new Set(dates)
  let streak = 0
  const d = new Date(today)
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!set.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export { getStreak }

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: loadHabits(),
  completions: loadCompletions(),

  addHabit: (title, color) => {
    const today = new Date()
    const createdAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const resolvedColor = color ?? COLORS[get().habits.length % COLORS.length]
    const habits = [...get().habits, { id, title, color: resolvedColor, createdAt }]
    saveHabits(habits)
    set({ habits })
  },

  renameHabit: (id, title, color) => {
    const habits = get().habits.map((h) => h.id === id ? { ...h, title, ...(color ? { color } : {}) } : h)
    saveHabits(habits)
    set({ habits })
  },

  removeHabit: (id) => {
    const habits = get().habits.filter((h) => h.id !== id)
    const completions = { ...get().completions }
    delete completions[id]
    saveHabits(habits)
    saveCompletions(completions)
    set({ habits, completions })
  },

  toggleCompletion: (habitId, date) => {
    const prev = get().completions[habitId] ?? []
    const already = prev.includes(date)
    const next = already ? prev.filter((d) => d !== date) : [...prev, date]
    const completions = { ...get().completions, [habitId]: next }
    saveCompletions(completions)
    set({ completions })
  },
}))
