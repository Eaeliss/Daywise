import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

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
  userId: string | null
  init: (userId: string) => Promise<void>
  addGoal: (title: string, targetAmount: number, deadline: string) => void
  updateGoal: (id: string, title: string, targetAmount: number, deadline: string) => void
  removeGoal: (id: string) => void
  setSaved: (id: string, amount: number) => void
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  goals: [],
  userId: null,

  init: async (userId) => {
    set({ userId })
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
    if (data) {
      set({
        goals: data.map((g) => ({
          id: g.id,
          title: g.title,
          targetAmount: g.target_amount,
          savedAmount: g.saved_amount,
          deadline: g.deadline ?? '',
          color: g.color,
        })),
      })
    }
  },

  addGoal: (title, targetAmount, deadline) => {
    const { userId } = get()
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const color = COLORS[get().goals.length % COLORS.length]
    const goal: SavingsGoal = { id, title, targetAmount, savedAmount: 0, deadline, color }
    set({ goals: [...get().goals, goal] })
    if (userId) {
      supabase.from('savings_goals').insert({
        id, user_id: userId, title, target_amount: targetAmount, saved_amount: 0, deadline, color,
      }).then()
    }
  },

  updateGoal: (id, title, targetAmount, deadline) => {
    const { userId } = get()
    set({ goals: get().goals.map((g) => g.id === id ? { ...g, title, targetAmount, deadline } : g) })
    if (userId) {
      supabase.from('savings_goals').update({ title, target_amount: targetAmount, deadline }).eq('id', id).then()
    }
  },

  removeGoal: (id) => {
    const { userId } = get()
    set({ goals: get().goals.filter((g) => g.id !== id) })
    if (userId) {
      supabase.from('savings_goals').delete().eq('id', id).then()
    }
  },

  setSaved: (id, amount) => {
    const { userId } = get()
    const savedAmount = Math.max(0, amount)
    set({ goals: get().goals.map((g) => g.id === id ? { ...g, savedAmount } : g) })
    if (userId) {
      supabase.from('savings_goals').update({ saved_amount: savedAmount }).eq('id', id).then()
    }
  },
}))
