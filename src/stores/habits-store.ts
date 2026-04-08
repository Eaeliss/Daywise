import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type Habit = {
  id: string
  title: string
  color: string
  createdAt: string // YYYY-MM-DD
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#10b981']

type HabitsState = {
  habits: Habit[]
  completions: Record<string, string[]>
  userId: string | null
  init: (userId: string) => Promise<void>
  reset: () => void
  addHabit: (title: string, color?: string) => void
  renameHabit: (id: string, title: string, color?: string) => void
  removeHabit: (id: string) => void
  toggleCompletion: (habitId: string, date: string) => void
}

function getTodayString() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function getStreak(dates: string[], today: string): number {
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

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  completions: {},
  userId: null,

  reset: () => set({ habits: [], completions: {}, userId: null }),

  init: async (userId) => {
    set({ userId })
    const [habitsRes, completionsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('habit_completions').select('*').eq('user_id', userId),
    ])
    const habits: Habit[] = (habitsRes.data ?? []).map((h) => ({
      id: h.id,
      title: h.title,
      color: h.color,
      createdAt: h.created_at,
    }))
    const completions: Record<string, string[]> = {}
    for (const c of completionsRes.data ?? []) {
      if (!completions[c.habit_id]) completions[c.habit_id] = []
      completions[c.habit_id].push(c.date)
    }
    set({ habits, completions })
  },

  addHabit: (title, color) => {
    const { userId } = get()
    const createdAt = getTodayString()
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const resolvedColor = color ?? COLORS[get().habits.length % COLORS.length]
    set({ habits: [...get().habits, { id, title, color: resolvedColor, createdAt }] })
    if (userId) {
      supabase.from('habits').insert({ id, user_id: userId, title, color: resolvedColor, created_at: createdAt }).then()
    }
  },

  renameHabit: (id, title, color) => {
    const { userId } = get()
    const habits = get().habits.map((h) => h.id === id ? { ...h, title, ...(color ? { color } : {}) } : h)
    set({ habits })
    if (userId) {
      supabase.from('habits').update({ title, ...(color ? { color } : {}) }).eq('id', id).then()
    }
  },

  removeHabit: (id) => {
    const { userId } = get()
    const habits = get().habits.filter((h) => h.id !== id)
    const completions = { ...get().completions }
    delete completions[id]
    set({ habits, completions })
    if (userId) {
      // habit_completions cascade-delete via FK
      supabase.from('habits').delete().eq('id', id).then()
    }
  },

  toggleCompletion: (habitId, date) => {
    const { userId } = get()
    const prev = get().completions[habitId] ?? []
    const already = prev.includes(date)
    const next = already ? prev.filter((d) => d !== date) : [...prev, date]
    set({ completions: { ...get().completions, [habitId]: next } })
    if (userId) {
      if (already) {
        supabase.from('habit_completions').delete().eq('habit_id', habitId).eq('date', date).then()
      } else {
        supabase.from('habit_completions').insert({ habit_id: habitId, user_id: userId, date }).then()
      }
    }
  },
}))
