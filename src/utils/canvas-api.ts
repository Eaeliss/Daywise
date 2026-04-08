/**
 * Canvas LMS REST API client.
 * Uses a personal access token (generated in Canvas → Account → Settings → New Access Token).
 */

export type CanvasCourse = {
  id: number
  name: string
  course_code: string
  enrollment_term_id: number
}

export type CanvasAssignment = {
  id: number
  course_id: number
  name: string
  due_at: string | null        // ISO 8601
  points_possible: number | null
  submission_types: string[]
  has_submitted_submissions: boolean
}

export type CanvasSubmission = {
  assignment_id: number
  workflow_state: 'submitted' | 'graded' | 'unsubmitted' | 'pending_review'
  submitted_at: string | null
  score: number | null
  grade: string | null
}

async function canvasFetch<T>(
  baseUrl: string,
  token: string,
  path: string,
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Canvas API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

/** Fetches all active courses the user is enrolled in. */
export async function fetchCourses(baseUrl: string, token: string): Promise<CanvasCourse[]> {
  return canvasFetch<CanvasCourse[]>(
    baseUrl, token,
    '/courses?enrollment_state=active&enrollment_type=student&per_page=50',
  )
}

/** Fetches assignments for a course. */
export async function fetchAssignments(baseUrl: string, token: string, courseId: number): Promise<CanvasAssignment[]> {
  return canvasFetch<CanvasAssignment[]>(
    baseUrl, token,
    `/courses/${courseId}/assignments?order_by=due_at&per_page=100&include[]=submission`,
  )
}

/** Fetches the current user's submission for a specific assignment. */
export async function fetchSubmission(
  baseUrl: string, token: string, courseId: number, assignmentId: number,
): Promise<CanvasSubmission | null> {
  try {
    return await canvasFetch<CanvasSubmission>(
      baseUrl, token,
      `/courses/${courseId}/assignments/${assignmentId}/submissions/self`,
    )
  } catch {
    return null
  }
}
