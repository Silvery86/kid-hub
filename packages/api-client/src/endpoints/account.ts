import type { HttpTransport } from '../http'

/**
 * Account-scoped calls: they concern the signed-in parent, not any one student,
 * and so deliberately live outside the student-bound client.
 */

export interface StudentSummary {
  id: string
  name: string
  gradeLevel: number
  avatarUrl: string | null
  role: 'OWNER' | 'GUARDIAN'
}

export interface ParentAccount {
  id: string
  email: string
  isAdmin: boolean
  status: string
  students: StudentSummary[]
}

/** The signed-in parent plus the students they may act for. */
export const getMe = (http: HttpTransport): Promise<ParentAccount> =>
  http.get<ParentAccount>('/parents/me')

export const listStudents = (http: HttpTransport): Promise<StudentSummary[]> =>
  http.get<StudentSummary[]>('/parents/me/students')

export const createStudent = (
  http: HttpTransport,
  input: { name: string; gradeLevel: number }
): Promise<{ id: string }> => http.post<{ id: string }>('/parents/me/students', input)

/**
 * Open signup. Returns no tokens by design — the account is PENDING until an
 * admin approves it, so the caller must send the applicant to a waiting screen
 * rather than into the app.
 */
export const register = (
  http: HttpTransport,
  input: { email: string; password: string; student: { name: string; gradeLevel: number } }
): Promise<{ status: 'PENDING' }> => http.post<{ status: 'PENDING' }>('/auth/register', input)
