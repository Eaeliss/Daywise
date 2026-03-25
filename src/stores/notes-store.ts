import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type Note = {
  id: string
  title: string
  body: string
  date: string // YYYY-MM-DD
  updatedAt: string // ISO timestamp
  tags: string[]
}

type NotesState = {
  notes: Note[]
  userId: string | null
  init: (userId: string) => Promise<void>
  addNote: (title: string, body: string) => string
  updateNote: (id: string, title: string, body: string) => void
  updateTags: (id: string, tags: string[]) => void
  removeNote: (id: string) => void
}

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  userId: null,

  init: async (userId) => {
    set({ userId })
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (data) {
      set({
        notes: data.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body ?? '',
          date: n.date,
          updatedAt: n.updated_at,
          tags: n.tags ?? [],
        })),
      })
    }
  },

  addNote: (title, body) => {
    const { userId } = get()
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const now = new Date().toISOString()
    const note: Note = { id, title, body, date: getToday(), updatedAt: now, tags: [] }
    set({ notes: [note, ...get().notes] })
    if (userId) {
      supabase.from('notes').insert({
        id, user_id: userId, title, body, date: note.date, updated_at: now, tags: [],
      }).then()
    }
    return id
  },

  updateNote: (id, title, body) => {
    const { userId } = get()
    const now = new Date().toISOString()
    set({ notes: get().notes.map((n) => n.id === id ? { ...n, title, body, updatedAt: now } : n) })
    if (userId) {
      supabase.from('notes').update({ title, body, updated_at: now }).eq('id', id).then()
    }
  },

  updateTags: (id, tags) => {
    const { userId } = get()
    const now = new Date().toISOString()
    set({ notes: get().notes.map((n) => n.id === id ? { ...n, tags, updatedAt: now } : n) })
    if (userId) {
      supabase.from('notes').update({ tags, updated_at: now }).eq('id', id).then()
    }
  },

  removeNote: (id) => {
    const { userId } = get()
    set({ notes: get().notes.filter((n) => n.id !== id) })
    if (userId) {
      supabase.from('notes').delete().eq('id', id).then()
    }
  },
}))
