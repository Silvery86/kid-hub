'use client'

import { useState, useEffect, useCallback } from 'react'
import { PinKeypad } from '@/components/ui/PinKeypad'
import { KidButton } from '@/components/ui/KidButton'
import { STORAGE_KEYS, MAX_PIN_ATTEMPTS, PIN_LOCKOUT_SECONDS } from '@/lib/constants'

// ── PIN hashing via Web Crypto (SHA-256 + constant salt) ─────────────────────

const PIN_SALT = 'kid-hub-pin-v1'

const hashPin = async (pin: string): Promise<string> => {
  const data = new TextEncoder().encode(pin + PIN_SALT)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface StoredPinData {
  hash: string
  failedAttempts: number
  lastFailedAt: number | null
}

const readPinData = (): StoredPinData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIN_DATA)
    return raw ? (JSON.parse(raw) as StoredPinData) : null
  } catch {
    return null
  }
}

const writePinData = (data: StoredPinData): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PIN_DATA, JSON.stringify(data))
  } catch {
    // Ignore write errors
  }
}

// ── State machine ─────────────────────────────────────────────────────────────

type PinState = 'setup-enter' | 'setup-confirm' | 'verify' | 'locked' | 'unlocked'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [pinState, setPinState] = useState<PinState>('verify')
  const [pendingPin, setPendingPin] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0)

  // Determine initial state from stored PIN data
  useEffect(() => {
    const stored = readPinData()
    if (!stored) {
      setPinState('setup-enter')
      return
    }
    if (
      stored.failedAttempts >= MAX_PIN_ATTEMPTS &&
      stored.lastFailedAt !== null &&
      (Date.now() - stored.lastFailedAt) / 1000 < PIN_LOCKOUT_SECONDS
    ) {
      const remaining = Math.ceil(PIN_LOCKOUT_SECONDS - (Date.now() - stored.lastFailedAt) / 1000)
      setLockoutSecondsLeft(remaining)
      setPinState('locked')
    } else {
      setPinState('verify')
    }
  }, [])

  // Lockout countdown
  useEffect(() => {
    if (pinState !== 'locked') return
    if (lockoutSecondsLeft <= 0) {
      // Reset attempts and allow re-entry
      const stored = readPinData()
      if (stored) writePinData({ ...stored, failedAttempts: 0, lastFailedAt: null })
      setPinState('verify')
      return
    }
    const t = setTimeout(() => setLockoutSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [pinState, lockoutSecondsLeft])

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
      const hash = await hashPin(pin)
      writePinData({ hash, failedAttempts: 0, lastFailedAt: null })
      setPinState('unlocked')
    },
    [pendingPin]
  )

  // ── Verify flow ─────────────────────────────────────────────────────────────

  const handleVerify = useCallback(async (pin: string) => {
    const stored = readPinData()
    if (!stored) {
      setPinState('setup-enter')
      return
    }
    const hash = await hashPin(pin)
    if (hash === stored.hash) {
      writePinData({ ...stored, failedAttempts: 0, lastFailedAt: null })
      setPinState('unlocked')
    } else {
      const newAttempts = stored.failedAttempts + 1
      const now = Date.now()
      writePinData({ ...stored, failedAttempts: newAttempts, lastFailedAt: now })
      setErrorCount((c) => c + 1)
      if (newAttempts >= MAX_PIN_ATTEMPTS) {
        setLockoutSecondsLeft(PIN_LOCKOUT_SECONDS)
        setPinState('locked')
      }
    }
  }, [])

  const handleResetPin = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PIN_DATA)
    } catch {
      // ignore
    }
    setErrorCount(0)
    setPendingPin('')
    setPinState('setup-enter')
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (pinState === 'unlocked') {
    return <div className="relative min-h-screen bg-slate-50">{children}</div>
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
            <PinKeypad onComplete={handleSetupEnter} errorCount={errorCount} />
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
            <PinKeypad onComplete={handleSetupConfirm} errorCount={errorCount} />
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
            <PinKeypad onComplete={handleVerify} errorCount={errorCount} />
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
              <span className="font-bold text-white">{lockoutSecondsLeft}s</span>
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
