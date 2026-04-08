import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

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
  userId: string | null
  init: (userId: string) => Promise<void>
  reset: () => void
  addGoal: (title: string, description: string, targetDate: string, progressTarget: number) => string
  updateGoal: (id: string, title: string, description: string, targetDate: string) => void
  toggleGoal: (id: string) => void
  removeGoal: (id: string) => void
  updateProgress: (id: string, current: number) => void
  addMilestone: (goalId: string, title: string) => void
  toggleMilestone: (goalId: string, milestoneId: string) => void
  removeMilestone: (goalId: string, milestoneId: string) => void
}

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function syncGoal(userId: string, goal: Goal) {
  supabase.from('goals').upsert({
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description,
    target_date: goal.targetDate,
    completed: goal.completed,
    created_at: goal.createdAt,
    progress_target: goal.progressTarget,
    progress_current: goal.progressCurrent,
    milestones: goal.milestones,
  }).then()
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  userId: null,

  reset: () => set({ goals: [], userId: null }),

  init: async (userId) => {
    set({ userId })
    const { data } = await supabase.from('goals').select('*').eq('user_id', userId)
    if (data) {
      set({
        goals: data.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description ?? '',
          targetDate: g.target_date ?? '',
          completed: g.completed ?? false,
          createdAt: g.created_at,
          progressTarget: g.progress_target ?? 0,
          progressCurrent: g.progress_current ?? 0,
          milestones: g.milestones ?? [],
        })),
      })
    }
  },

  addGoal: (title, description, targetDate, progressTarget) => {
    const { userId } = get()
    const id = makeId()
    const goal: Goal = {
      id, title, description, targetDate,
      completed: false,
      createdAt: getTodayString(),
      progressTarget,
      progressCurrent: 0,
      milestones: [],
    }
    set({ goals: [...get().goals, goal] })
    if (userId) syncGoal(userId, goal)
    return id
  },

  updateGoal: (id, title, description, targetDate) => {
    const { userId } = get()
    const goals = get().goals.map((g) => g.id === id ? { ...g, title, description, targetDate } : g)
    set({ goals })
    if (userId) {
      const updated = goals.find((g) => g.id === id)
      if (updated) syncGoal(userId, updated)
    }
  },

  toggleGoal: (id) => {
    const { userId } = get()
    const goals = get().goals.map((g) => g.id === id ? { ...g, completed: !g.completed } : g)
    set({ goals })
    if (userId) {
      const updated = goals.find((g) => g.id === id)
      if (updated) supabase.from('goals').update({ completed: updated.completed }).eq('id', id).then()
    }
  },

  removeGoal: (id) => {
    const { userId } = get()
    set({ goals: get().goals.filter((g) => g.id !== id) })
    if (userId) supabase.from('goals').delete().eq('id', id).then()
  },

  updateProgress: (id, current) => {
    const { userId } = get()
    const goals = get().goals.map((g) => {
      if (g.id !== id) return g
      const progressCurrent = Math.min(Math.max(0, current), g.progressTarget)
      const completed = g.progressTarget > 0 && progressCurrent >= g.progressTarget ? true : g.completed
      return { ...g, progressCurrent, completed }
    })
    set({ goals })
    if (userId) {
      const updated = goals.find((g) => g.id === id)
      if (updated) supabase.from('goals').update({ progress_current: updated.progressCurrent, completed: updated.completed }).eq('id', id).then()
    }
  },

  addMilestone: (goalId, title) => {
    const { userId } = get()
    const id = makeId()
    const goals = get().goals.map((g) =>
      g.id === goalId ? { ...g, milestones: [...g.milestones, { id, title, completed: false }] } : g
    )
    set({ goals })
    if (userId) {
      const updated = goals.find((g) => g.id === goalId)
      if (updated) supabase.from('goals').update({ milestones: updated.milestones }).eq('id', goalId).then()
    }
  },

  toggleMilestone: (goalId, milestoneId) => {
    const { userId } = get()
    const goals = get().goals.map((g) =>
      g.id === goalId
        ? { ...g, milestones: g.milestones.map((m) => m.id === milestoneId ? { ...m, completed: !m.completed } : m) }
        : g
    )
    set({ goals })
    if (userId) {
      const updated = goals.find((g) => g.id === goalId)
      if (updated) supabase.from('goals').update({ milestones: updated.milestones }).eq('id', goalId).then()
    }
  },

  removeMilestone: (goalId, milestoneId) => {
    const { userId } = get()
    const goals = get().goals.map((g) =>
      g.id === goalId ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) } : g
    )
    set({ goals })
    if (userId) {
      const updated = goals.find((g) => g.id === goalId)
      if (updated) supabase.from('goals').update({ milestones: updated.milestones }).eq('id', goalId).then()
    }
  },
}))
