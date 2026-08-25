// use-kid-gate.ts — whether the kid unlock screen has been cleared this launch.
//
// This is a UI gate, not an auth boundary. Mobile authenticates with the Bearer
// token from parent login and /api/v1/* sits outside the middleware matcher, so
// a pattern cannot gate API access the way web's KID_SESSION_COOKIE does. What
// must not live on the device — the pattern hash, the attempt count and the
// lockout — stays behind POST /api/v1/auth/kid-pattern.
//
// Deliberately not persisted: the gate should close again on a cold start.
import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface KidGateValue {
  isUnlocked: boolean
  unlock: () => void
  lock: () => void
}

const KidGateContext = createContext<KidGateValue | null>(null)

export function KidGateProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false)

  const unlock = useCallback(() => setIsUnlocked(true), [])
  const lock = useCallback(() => setIsUnlocked(false), [])

  const value = useMemo<KidGateValue>(() => ({ isUnlocked, unlock, lock }), [isUnlocked, unlock, lock])

  return createElement(KidGateContext.Provider, { value }, children)
}

export function useKidGate(): KidGateValue {
  const ctx = useContext(KidGateContext)
  if (!ctx) throw new Error('useKidGate must be used inside a KidGateProvider')
  return ctx
}
