// auth.api.ts
//
// Transport for the parent session: POST /auth/login and /auth/logout.
// Tokens are persisted to SecureStore here; the axios client reads them back
// on every request and rotates them via /auth/refresh (see client.ts).
import { isAxiosError } from 'axios'

import { clearTokens, getRefreshToken, setTokens } from '@/lib/secure-store'

import { api } from './client'

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string; lockoutSeconds?: number }

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const { data } = await api.post('/auth/login', { email, password })
    if (data?.success && data.accessToken && data.refreshToken) {
      await setTokens(data.accessToken, data.refreshToken)
      return { ok: true }
    }
    return { ok: false, error: data?.error ?? 'Login failed' }
  } catch (err) {
    if (isAxiosError(err) && err.response) {
      const body = err.response.data as { error?: string; lockoutSeconds?: number } | undefined
      if (err.response.status === 429) {
        return { ok: false, error: 'locked', lockoutSeconds: body?.lockoutSeconds }
      }
      return { ok: false, error: body?.error ?? 'Invalid credentials' }
    }
    return { ok: false, error: 'Network error — check EXPO_PUBLIC_API_URL' }
  }
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken()
  if (refreshToken) {
    try {
      await api.post('/auth/logout', { refreshToken })
    } catch {
      // Revocation is best-effort; clear locally regardless.
    }
  }
  await clearTokens()
}
