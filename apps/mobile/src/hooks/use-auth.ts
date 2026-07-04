// use-auth.ts
//
// App-wide auth state. Bootstraps from SecureStore on mount (was a session
// stored on a previous launch?), then exposes signIn/signOut. The whole app is
// gated on `status`: the root index redirects to /login vs /(tabs) accordingly.
import { useQueryClient } from '@tanstack/react-query'
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { login as loginRequest, logout as logoutRequest } from '@/api/auth.api'
import type { LoginResult } from '@/api/auth.api'
import { getAccessToken } from '@/lib/secure-store'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<LoginResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const queryClient = useQueryClient()

  // Restore any persisted session on first launch.
  useEffect(() => {
    let active = true
    getAccessToken()
      .then((token) => {
        if (active) setStatus(token ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (active) setStatus('unauthenticated')
      })
    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await loginRequest(email, password)
    if (result.ok) setStatus('authenticated')
    return result
  }, [])

  const signOut = useCallback(async () => {
    await logoutRequest()
    queryClient.clear()
    setStatus('unauthenticated')
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ status, signIn, signOut }),
    [status, signIn, signOut],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
