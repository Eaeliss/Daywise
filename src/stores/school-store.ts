import { create } from 'zustand'
import { createStorage } from '@/lib/storage'
import { fetchCourses, fetchAssignments, CanvasCourse, CanvasAssignment } from '@/utils/canvas-api'

const storage = createStorage('school')

export type Assignment = {
  id: number
  courseId: number
  name: string
  dueAt: string | null    // ISO 8601
  pointsPossible: number | null
  completed: boolean      // true if submitted on Canvas OR manually ticked
  submittedOnCanvas: boolean
  grade: string | null
}

export type Course = {
  id: number
  name: string
  courseCode: string
  assignments: Assignment[]
}

type SchoolState = {
  canvasUrl: string
  canvasToken: string
  courses: Course[]
  loading: boolean
  lastSynced: string | null  // ISO timestamp
  setCredentials: (url: string, token: string) => void
  clearCredentials: () => void
  syncFromCanvas: () => Promise<void>
  toggleAssignment: (courseId: number, assignmentId: number) => void
  hasCredentials: () => boolean
}

function load(key: string): string {
  return storage.getString(key) ?? ''
}

function save(key: string, value: string) {
  storage.set(key, value)
}

function loadCourses(): Course[] {
  try {
    const raw = storage.getString('courses')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCourses(courses: Course[]) {
  storage.set('courses', JSON.stringify(courses))
}

export const useSchoolStore = create<SchoolState>((set, get) => ({
  canvasUrl: load('canvasUrl'),
  canvasToken: load('canvasToken'),
  courses: loadCourses(),
  loading: false,
  lastSynced: storage.getString('lastSynced') ?? null,

  setCredentials: (url, token) => {
    save('canvasUrl', url)
    save('canvasToken', token)
    set({ canvasUrl: url, canvasToken: token })
  },

  clearCredentials: () => {
    save('canvasUrl', '')
    save('canvasToken', '')
    storage.delete('courses')
    storage.delete('lastSynced')
    set({ canvasUrl: '', canvasToken: '', courses: [], lastSynced: null })
  },

  syncFromCanvas: async () => {
    const { canvasUrl, canvasToken, courses: existing } = get()
    if (!canvasUrl || !canvasToken) return

    set({ loading: true })
    try {
      const rawCourses: CanvasCourse[] = await fetchCourses(canvasUrl, canvasToken)

      const updated: Course[] = await Promise.all(
        rawCourses.map(async (c) => {
          let rawAssignments: CanvasAssignment[] = []
          try {
            rawAssignments = await fetchAssignments(canvasUrl, canvasToken, c.id)
          } catch {}

          const existingCourse = existing.find((ec) => ec.id === c.id)

          const assignments: Assignment[] = rawAssignments.map((a) => {
            // Preserve manual completion if no canvas submission
            const existingAssignment = existingCourse?.assignments.find((ea) => ea.id === a.id)
            const submittedOnCanvas = a.has_submitted_submissions
            return {
              id: a.id,
              courseId: c.id,
              name: a.name,
              dueAt: a.due_at,
              pointsPossible: a.points_possible,
              completed: submittedOnCanvas || (existingAssignment?.completed ?? false),
              submittedOnCanvas,
              grade: null,
            }
          })

          return {
            id: c.id,
            name: c.name,
            courseCode: c.course_code,
            assignments,
          }
        }),
      )

      const now = new Date().toISOString()
      save('lastSynced', now)
      saveCourses(updated)
      set({ courses: updated, lastSynced: now })
    } catch (e) {
      // Sync failed — keep existing data
      throw e
    } finally {
      set({ loading: false })
    }
  },

  toggleAssignment: (courseId, assignmentId) => {
    const courses = get().courses.map((c) => {
      if (c.id !== courseId) return c
      return {
        ...c,
        assignments: c.assignments.map((a) => {
          if (a.id !== assignmentId) return a
          return { ...a, completed: !a.completed }
        }),
      }
    })
    saveCourses(courses)
    set({ courses })
  },

  hasCredentials: () => {
    const { canvasUrl, canvasToken } = get()
    return !!(canvasUrl && canvasToken)
  },
}))
