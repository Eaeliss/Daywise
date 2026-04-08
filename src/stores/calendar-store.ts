import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type CalendarRepeat = 'none' | 'daily' | 'weekly' | 'monthly'

export type CalendarEvent = {
  id: string
  title: string
  date: string      // start date YYYY-MM-DD
  endDate: string   // end date YYYY-MM-DD (same as date for single-day events)
  time: string      // HH:MM or ''
  repeat: CalendarRepeat
}

type CalendarState = {
  events: CalendarEvent[]
  userId: string | null
  init: (userId: string) => Promise<void>
  reset: () => void
  addEvent: (title: string, date: string, endDate: string, time: string, repeat: CalendarRepeat) => void
  updateEvent: (id: string, title: string, endDate: string, time: string, repeat: CalendarRepeat) => void
  removeEvent: (id: string) => void
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/** Returns true if a date (YYYY-MM-DD) matches the repeat pattern of an event */
export function matchesRepeat(event: CalendarEvent, dateStr: string): boolean {
  if (dateStr < event.date) return false
  const start = new Date(event.date + 'T00:00:00')
  const check = new Date(dateStr + 'T00:00:00')
  const diffMs = check.getTime() - start.getTime()
  const diffDays = Math.round(diffMs / 86400000)
  switch (event.repeat) {
    case 'daily': return true
    case 'weekly': return diffDays % 7 === 0
    case 'monthly': return start.getDate() === check.getDate()
    default: return false
  }
}

/** Returns true if the given date falls within or repeats for this event */
export function eventCoversDate(event: CalendarEvent, dateStr: string): boolean {
  const end = event.endDate || event.date
  if (dateStr >= event.date && dateStr <= end) return true
  if (event.repeat !== 'none' && dateStr >= event.date && matchesRepeat(event, dateStr)) return true
  return false
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  userId: null,

  reset: () => set({ events: [], userId: null }),

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
          endDate: e.end_date ?? e.date,
          time: e.time ?? '',
          repeat: (e.repeat as CalendarRepeat) ?? 'none',
        })),
      })
    }
  },

  addEvent: (title, date, endDate, time, repeat) => {
    const { userId } = get()
    const id = makeId()
    const safeEnd = endDate && endDate >= date ? endDate : date
    set({ events: [...get().events, { id, title, date, endDate: safeEnd, time, repeat }] })
    if (userId) {
      supabase.from('calendar_events').insert({
        id, user_id: userId, title, date, end_date: safeEnd, time, repeat,
      }).then()
    }
  },

  updateEvent: (id, title, endDate, time, repeat) => {
    const { userId } = get()
    set({
      events: get().events.map((e) => {
        if (e.id !== id) return e
        const safeEnd = endDate && endDate >= e.date ? endDate : e.date
        return { ...e, title, endDate: safeEnd, time, repeat }
      }),
    })
    if (userId) {
      const event = get().events.find((e) => e.id === id)
      if (event) {
        supabase.from('calendar_events').update({
          title, end_date: event.endDate, time, repeat,
        }).eq('id', id).then()
      }
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
