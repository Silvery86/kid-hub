// client.ts
//
// Axios instance that talks to the Next.js REST API (apps/web → /api/v1).
// - Request interceptor attaches the Bearer access token from SecureStore.
// - Response interceptor refreshes once on 401 (single-flight) then replays.
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/secure-store'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // e.g. http://192.168.1.x:3000/api/v1
  timeout: 10_000,
})

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
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
    if (error.response?.status === 401 && original && !original._retry) {
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
