// use-kid-gate.ts — the kid session on mobile.
//
// This used to be a UI gate only: mobile authenticated with the parent's Bearer
// token, so entering the pattern changed what was on screen and nothing else.
// The server now issues a kid token scoped to one student, and the transport
// sends that token while the app is in kid mode — so the pattern is a real
// boundary, and a child's screens cannot reach a parent endpoint.
//
// The token is persisted, but the gate is not: a cold start shows the pattern
// screen again even though the token is still valid, which is the behaviour a
// parent expects from handing over a locked device.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { setActor } from '@/api/client'
import { clearKidToken, setKidToken } from '@/lib/secure-store'

interface KidGateValue {
  isUnlocked: boolean
  /** Stores the kid token and switches the transport to it. */
  unlock: (kidToken?: string) => void
  lock: () => void
}

const KidGateContext = createContext<KidGateValue | null>(null)

export function KidGateProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false)

  const unlock = useCallback((kidToken?: string) => {
    if (kidToken) void setKidToken(kidToken)
    setActor('kid')
    setIsUnlocked(true)
  }, [])

  const lock = useCallback(() => {
    void clearKidToken()
    setActor('parent')
    setIsUnlocked(false)
  }, [])

  // A cold start begins locked, so the transport must not still be holding a
  // kid token from the previous run.
  useEffect(() => {
    setActor('parent')
  }, [])

  const value = useMemo<KidGateValue>(
    () => ({ isUnlocked, unlock, lock }),
    [isUnlocked, unlock, lock]
  )

  return createElement(KidGateContext.Provider, { value }, children)
}

export function useKidGate(): KidGateValue {
  const ctx = useContext(KidGateContext)
  if (!ctx) throw new Error('useKidGate must be used inside a KidGateProvider')
  return ctx
}
