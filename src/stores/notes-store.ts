import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('notes')

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
  addNote: (title: string, body: string) => string
  updateNote: (id: string, title: string, body: string) => void
  updateTags: (id: string, tags: string[]) => void
  removeNote: (id: string) => void
}

function load(): Note[] {
  const raw = storage.getString('notes')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return parsed.map((n: Note & { tags?: string[] }) => ({
      ...n,
      tags: n.tags ?? [],
    }))
  } catch { return [] }
}

function save(notes: Note[]) {
  storage.set('notes', JSON.stringify(notes))
}

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: load(),

  addNote: (title, body) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const now = new Date().toISOString()
    const notes = [{ id, title, body, date: getToday(), updatedAt: now, tags: [] }, ...get().notes]
    save(notes)
    set({ notes })
    return id
  },

  updateNote: (id, title, body) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, title, body, updatedAt: new Date().toISOString() } : n
    )
    save(notes)
    set({ notes })
  },

  updateTags: (id, tags) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, tags, updatedAt: new Date().toISOString() } : n
    )
    save(notes)
    set({ notes })
  },

  removeNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id)
    save(notes)
    set({ notes })
  },
}))
