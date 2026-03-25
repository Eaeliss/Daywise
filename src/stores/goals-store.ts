import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('goals')

export type Goal = {
  id: string
  title: string
  description: string  // empty string if not set
  targetDate: string   // YYYY-MM-DD or empty string
  completed: boolean
  createdAt: string    // YYYY-MM-DD
  progressTarget: number  // 0 = no numeric progress
  progressCurrent: number
  milestones: Array<{ id: string; title: string; completed: boolean }>
}

type GoalsState = {
  goals: Goal[]
  addGoal: (title: string, description: string, targetDate: string, progressTarget: number) => string
  updateGoal: (id: string, title: string, description: string, targetDate: string) => void
  toggleGoal: (id: string) => void
  removeGoal: (id: string) => void
  updateProgress: (id: string, current: number) => void
  addMilestone: (goalId: string, title: string) => void
  toggleMilestone: (goalId: string, milestoneId: string) => void
  removeMilestone: (goalId: string, milestoneId: string) => void
}

function loadGoals(): Goal[] {
  const raw = storage.getString('goals')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return parsed.map((g: Goal & { progressTarget?: number; progressCurrent?: number; milestones?: Goal['milestones'] }) => ({
      ...g,
      progressTarget: g.progressTarget ?? 0,
      progressCurrent: g.progressCurrent ?? 0,
      milestones: g.milestones ?? [],
    }))
  } catch { return [] }
}

function saveGoals(goals: Goal[]) {
  storage.set('goals', JSON.stringify(goals))
}

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: loadGoals(),

  addGoal: (title, description, targetDate, progressTarget) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const goals = [...get().goals, {
      id, title, description, targetDate,
      completed: false,
      createdAt: getTodayString(),
      progressTarget,
      progressCurrent: 0,
      milestones: [],
    }]
    saveGoals(goals)
    set({ goals })
    return id
  },

  updateGoal: (id, title, description, targetDate) => {
    const goals = get().goals.map((g) =>
      g.id === id ? { ...g, title, description, targetDate } : g
    )
    saveGoals(goals)
    set({ goals })
  },

  toggleGoal: (id) => {
    const goals = get().goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g,
    )
    saveGoals(goals)
    set({ goals })
  },

  removeGoal: (id) => {
    const current = get().goals
    const goals = current.filter((g) => g.id !== id)
    if (goals.length === current.length) return
    saveGoals(goals)
    set({ goals })
  },

  updateProgress: (id, current) => {
    const goals = get().goals.map((g) => {
      if (g.id !== id) return g
      const progressCurrent = Math.min(Math.max(0, current), g.progressTarget)
      const completed = g.progressTarget > 0 && progressCurrent >= g.progressTarget ? true : g.completed
      return { ...g, progressCurrent, completed }
    })
    saveGoals(goals)
    set({ goals })
  },

  addMilestone: (goalId, title) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const goals = get().goals.map((g) =>
      g.id === goalId
        ? { ...g, milestones: [...g.milestones, { id, title, completed: false }] }
        : g
    )
    saveGoals(goals)
    set({ goals })
  },

  toggleMilestone: (goalId, milestoneId) => {
    const goals = get().goals.map((g) =>
      g.id === goalId
        ? {
            ...g,
            milestones: g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            ),
          }
        : g
    )
    saveGoals(goals)
    set({ goals })
  },

  removeMilestone: (goalId, milestoneId) => {
    const goals = get().goals.map((g) =>
      g.id === goalId
        ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) }
        : g
    )
    saveGoals(goals)
    set({ goals })
  },
}))
