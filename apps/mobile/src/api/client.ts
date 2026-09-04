// client.ts
//
// Axios instance that talks to the Next.js REST API (apps/web → /api/v1).
// - Request interceptor attaches the Bearer access token from SecureStore.
// - Response interceptor refreshes once on 401 (single-flight) then replays.
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { clearTokens, getAccessToken, getKidToken, getRefreshToken, setTokens } from '@/lib/secure-store'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // e.g. http://192.168.1.x:3000/api/v1
  timeout: 10_000,
})

/**
 * Which credential the app is currently acting with.
 *
 * In kid mode the requests carry the kid token, which is scoped to one student
 * and carries no parent identity — so a child's screens cannot reach a parent
 * endpoint even if one were called by mistake. Parent mode keeps the parent
 * access token. Previously everything used the parent token, which made the
 * unlock pattern a UI gate rather than a boundary.
 */
export type Actor = 'parent' | 'kid'

let actor: Actor = 'parent'

export const setActor = (next: Actor): void => {
  actor = next
}

export const getActor = (): Actor => actor

api.interceptors.request.use(async (config) => {
  // Fall back to the parent token when kid mode has no token yet: the request
  // then fails the server's guard rather than going out unauthenticated.
  const token = actor === 'kid' ? ((await getKidToken()) ?? (await getAccessToken())) : await getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshing: Promise<string | null> | null = null

const refreshTokens = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) return null
    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
    await setTokens(data.accessToken, data.refreshToken)
    return data.accessToken as string
  } catch {
    await clearTokens()
    return null
  } finally {
    refreshing = null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    // Only the parent session can be refreshed. A dead kid token means the
    // unlock has lapsed, and the child is sent back to the pattern screen by
    // the gate rather than silently promoted to the parent's credential.
    if (error.response?.status === 401 && actor === 'parent' && original && !original._retry) {
      original._retry = true
      refreshing ??= refreshTokens()
      const newToken = await refreshing
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)
