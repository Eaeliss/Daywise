import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('calendar')

export type CalendarEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:MM or ''
}

type CalendarState = {
  events: CalendarEvent[]
  addEvent: (title: string, date: string, time: string) => void
  updateEvent: (id: string, title: string, time: string) => void
  removeEvent: (id: string) => void
}

function loadEvents(): CalendarEvent[] {
  const raw = storage.getString('events')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return parsed.map((e: CalendarEvent & { time?: string }) => ({
      ...e,
      time: e.time ?? '',
    }))
  } catch { return [] }
}

function saveEvents(events: CalendarEvent[]) {
  storage.set('events', JSON.stringify(events))
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: loadEvents(),

  addEvent: (title, date, time) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const events = [...get().events, { id, title, date, time }]
    saveEvents(events)
    set({ events })
  },

  updateEvent: (id, title, time) => {
    const events = get().events.map((e) => e.id === id ? { ...e, title, time } : e)
    saveEvents(events)
    set({ events })
  },

  removeEvent: (id) => {
    const current = get().events
    const events = current.filter((e) => e.id !== id)
    if (events.length === current.length) return
    saveEvents(events)
    set({ events })
  },
}))
