import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('savings')

export type SavingsGoal = {
  id: string
  title: string
  targetAmount: number
  savedAmount: number
  deadline: string // YYYY-MM-DD or ''
  color: string
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#10b981']

type SavingsState = {
  goals: SavingsGoal[]
  addGoal: (title: string, targetAmount: number, deadline: string) => void
  updateGoal: (id: string, title: string, targetAmount: number, deadline: string) => void
  removeGoal: (id: string) => void
  setSaved: (id: string, amount: number) => void
}

function load(): SavingsGoal[] {
  const raw = storage.getString('goals')
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function save(goals: SavingsGoal[]) {
  storage.set('goals', JSON.stringify(goals))
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  goals: load(),

  addGoal: (title, targetAmount, deadline) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const color = COLORS[get().goals.length % COLORS.length]
    const goals = [...get().goals, { id, title, targetAmount, savedAmount: 0, deadline, color }]
    save(goals)
    set({ goals })
  },

  updateGoal: (id, title, targetAmount, deadline) => {
    const goals = get().goals.map((g) => g.id === id ? { ...g, title, targetAmount, deadline } : g)
    save(goals)
    set({ goals })
  },

  removeGoal: (id) => {
    const goals = get().goals.filter((g) => g.id !== id)
    save(goals)
    set({ goals })
  },

  setSaved: (id, amount) => {
    const goals = get().goals.map((g) =>
      g.id === id ? { ...g, savedAmount: Math.max(0, amount) } : g
    )
    save(goals)
    set({ goals })
  },
}))
