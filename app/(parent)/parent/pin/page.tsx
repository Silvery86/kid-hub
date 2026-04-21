'use client'

/**
 * PIN entry page for parent mode authentication.
 * Handles both initial PIN setup (if no PIN is stored) and PIN verification.
 * On successful verification a session cookie is set server-side and the user
 * is redirected to the parent dashboard.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PinKeypad } from '@/components/ui/PinKeypad'
import { KidButton } from '@/components/ui/KidButton'
import {
  setPinAction,
  verifyPinAction,
  checkParentSessionAction,
} from '@/server/actions/auth.actions'

type PinState = 'loading' | 'setup-enter' | 'setup-confirm' | 'verify' | 'locked'

export default function ParentPinPage() {
  const router = useRouter()
  const [pinState, setPinState] = useState<PinState>('loading')
  const [pendingPin, setPendingPin] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    checkParentSessionAction().then(({ hasSession, hasPinSet }) => {
      if (hasSession) {
        router.replace('/parent')
        return
      }
      setPinState(hasPinSet ? 'verify' : 'setup-enter')
    })
  }, [router])

  // Lockout countdown
  useEffect(() => {
    if (pinState !== 'locked' || lockoutSeconds <= 0) return
    const t = setTimeout(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) setPinState('verify')
        return s - 1
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [pinState, lockoutSeconds])

  // ── Setup flow ──────────────────────────────────────────────────────────────

  const handleSetupEnter = useCallback((pin: string) => {
    setPendingPin(pin)
    setPinState('setup-confirm')
  }, [])

  const handleSetupConfirm = useCallback(
    async (pin: string) => {
      if (pin !== pendingPin) {
        setErrorCount((c) => c + 1)
        setPinState('setup-enter')
        setPendingPin('')
        return
      }
      setIsSubmitting(true)
      const result = await setPinAction(pin)
      setIsSubmitting(false)
      if (!result.success) {
        setErrorCount((c) => c + 1)
        setPinState('setup-enter')
        return
      }
      const verifyResult = await verifyPinAction(pin)
      if (verifyResult.success) {
        router.replace('/parent')
      }
    },
    [pendingPin, router]
  )

  // ── Verify flow ─────────────────────────────────────────────────────────────

  const handleVerify = useCallback(
    async (pin: string) => {
      setIsSubmitting(true)
      const result = await verifyPinAction(pin)
      setIsSubmitting(false)
      if (result.success) {
        router.replace('/parent')
        return
      }
      if (result.isLocked) {
        setLockoutSeconds(result.lockoutSeconds ?? 60)
        setPinState('locked')
        return
      }
      setErrorCount((c) => c + 1)
    },
    [router]
  )

  const handleResetPin = useCallback(() => {
    setErrorCount(0)
    setPendingPin('')
    setPinState('setup-enter')
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (pinState === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="text-4xl">🔐</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-slate-900">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 px-6">
        {pinState === 'setup-enter' && (
          <>
            <div className="text-center">
              <div className="mb-4 text-7xl" aria-hidden="true">
                🔐
              </div>
              <h1 className="text-3xl font-bold text-white">Tạo mã PIN</h1>
              <p className="mt-2 text-slate-400">Nhập mã PIN 4 chữ số mới</p>
            </div>
            <PinKeypad onComplete={handleSetupEnter} errorCount={errorCount} disabled={isSubmitting} />
          </>
        )}

        {pinState === 'setup-confirm' && (
          <>
            <div className="text-center">
              <div className="mb-4 text-7xl" aria-hidden="true">
                ✅
              </div>
              <h1 className="text-3xl font-bold text-white">Xác nhận PIN</h1>
              <p className="mt-2 text-slate-400">Nhập lại mã PIN vừa tạo</p>
            </div>
            <PinKeypad onComplete={handleSetupConfirm} errorCount={errorCount} disabled={isSubmitting} />
          </>
        )}

        {pinState === 'verify' && (
          <>
            <div className="text-center">
              <div className="mb-4 text-7xl" aria-hidden="true">
                🔒
              </div>
              <h1 className="text-3xl font-bold text-white">Parent Mode</h1>
              <p className="mt-2 text-slate-400">Nhập mã PIN để tiếp tục</p>
            </div>
            <PinKeypad onComplete={handleVerify} errorCount={errorCount} disabled={isSubmitting} />
            <button
              onClick={handleResetPin}
              className="text-sm text-slate-600 transition-colors hover:text-slate-400"
            >
              Quên mã PIN?
            </button>
          </>
        )}

        {pinState === 'locked' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-7xl" aria-hidden="true">
              ⛔
            </div>
            <h1 className="text-3xl font-bold text-white">Đã khóa tạm thời</h1>
            <p className="text-lg text-slate-400">
              Vui lòng thử lại sau{' '}
              <span className="font-bold text-white">{lockoutSeconds}s</span>
            </p>
            <KidButton variant="ghost" onClick={handleResetPin} className="min-h-10 text-sm">
              Đặt lại PIN
            </KidButton>
          </div>
        )}
      </div>
    </div>
  )
}
