import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type CalendarEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:MM or ''
}

type CalendarState = {
  events: CalendarEvent[]
  userId: string | null
  init: (userId: string) => Promise<void>
  addEvent: (title: string, date: string, time: string) => void
  updateEvent: (id: string, title: string, time: string) => void
  removeEvent: (id: string) => void
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  userId: null,

  init: async (userId) => {
    set({ userId })
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
    if (data) {
      set({
        events: data.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.time ?? '',
        })),
      })
    }
  },

  addEvent: (title, date, time) => {
    const { userId } = get()
    const id = makeId()
    set({ events: [...get().events, { id, title, date, time }] })
    if (userId) {
      supabase.from('calendar_events').insert({ id, user_id: userId, title, date, time }).then()
    }
  },

  updateEvent: (id, title, time) => {
    const { userId } = get()
    set({ events: get().events.map((e) => e.id === id ? { ...e, title, time } : e) })
    if (userId) {
      supabase.from('calendar_events').update({ title, time }).eq('id', id).then()
    }
  },

  removeEvent: (id) => {
    const { userId } = get()
    set({ events: get().events.filter((e) => e.id !== id) })
    if (userId) {
      supabase.from('calendar_events').delete().eq('id', id).then()
    }
  },
}))
