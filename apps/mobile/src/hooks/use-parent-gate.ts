// use-parent-gate.ts — whether the parent PIN has been entered this launch.
//
// The mirror of use-kid-gate: the API already trusts the Bearer token from
// parent login, so the PIN is a second factor in front of the management UI
// rather than an API boundary. The check itself runs on the server, which owns
// the hash, the attempt counter and the lockout.
//
// Not persisted: leaving the app should close the parent section again.
import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface ParentGateValue {
  isVerified: boolean
  verify: () => void
  reset: () => void
}

const ParentGateContext = createContext<ParentGateValue | null>(null)

export function ParentGateProvider({ children }: { children: ReactNode }) {
  const [isVerified, setIsVerified] = useState(false)

  const verify = useCallback(() => setIsVerified(true), [])
  const reset = useCallback(() => setIsVerified(false), [])

  const value = useMemo<ParentGateValue>(
    () => ({ isVerified, verify, reset }),
    [isVerified, verify, reset]
  )

  return createElement(ParentGateContext.Provider, { value }, children)
}

export function useParentGate(): ParentGateValue {
  const ctx = useContext(ParentGateContext)
  if (!ctx) throw new Error('useParentGate must be used inside a ParentGateProvider')
  return ctx
}
