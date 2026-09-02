// http.ts
//
// Binds @kid-hub/api-client to the mobile transport: the existing axios `api`
// instance (Bearer + single-flight refresh from client.ts). Endpoint fetchers
// are consumed via `apiClient`.
import {
  createApiClient,
  unwrapEnvelope,
  type HttpTransport,
  type StudentClient,
} from '@kid-hub/api-client'

import { api } from './client'

const axiosTransport: HttpTransport = {
  get: async <T>(path: string): Promise<T> => {
    const { data } = await api.get(path)
    return unwrapEnvelope<T>(data)
  },
  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const { data } = await api.post(path, body)
    return unwrapEnvelope<T>(data)
  },
  put: async <T>(path: string, body?: unknown): Promise<T> => {
    const { data } = await api.put(path, body)
    return unwrapEnvelope<T>(data)
  },
  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    const { data } = await api.patch(path, body)
    return unwrapEnvelope<T>(data)
  },
  delete: async <T>(path: string): Promise<T> => {
    const { data } = await api.delete(path)
    return unwrapEnvelope<T>(data)
  },
}

/** Account-scoped calls: login state, the student list, the parent PIN. */
export const apiClient = createApiClient(axiosTransport)

// ── Active student ───────────────────────────────────────────────────────────
// Every student-scoped path names its student, so the app has to know which one
// it is looking at. Held in memory for now and resolved from the account on
// first use; the picker and its persistence come with the mobile student work.

let activeStudentId: string | null = null
let resolving: Promise<string> | null = null

/** Switches the student every subsequent scoped call is about. */
export const setActiveStudent = (id: string | null): void => {
  activeStudentId = id
  resolving = null
}

export const getActiveStudentId = (): string | null => activeStudentId

const resolveActiveStudent = async (): Promise<string> => {
  if (activeStudentId) return activeStudentId
  // Single-flight, like the token refresh: several screens mount at once and
  // must not each fetch the student list.
  resolving ??= (async () => {
    const students = await apiClient.listStudents()
    const first = students[0]
    if (!first) throw new Error('This account has no students yet')
    activeStudentId = first.id
    return first.id
  })()
  return resolving
}

/**
 * The client bound to the active student. Scoped fetchers go through here
 * rather than holding an id of their own, so a switch takes effect everywhere.
 */
export const studentApi = async (): Promise<StudentClient> =>
  apiClient.forStudent(await resolveActiveStudent())
