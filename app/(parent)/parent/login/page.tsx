'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  checkParentSessionAction,
  parentLoginAction,
  registerParentAccountAction,
} from '@/server/actions/auth.actions'

type LoginMode = 'loading' | 'signup' | 'login'

export default function ParentLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    checkParentSessionAction().then(({ hasSession, hasParentAccount }) => {
      if (hasSession) {
        router.replace('/parent')
        return
      }
      setMode(hasParentAccount ? 'login' : 'signup')
    })
  }, [router])

  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return
    const timer = setTimeout(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          setIsLocked(false)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [isLocked, lockoutSeconds])

  const heading = useMemo(() => {
    if (mode === 'signup') return 'Thiết lập tài khoản phụ huynh'
    return 'Đăng nhập phụ huynh'
  }, [mode])

  const submit = async () => {
    if (isLocked || isSubmitting) return

    setError('')
    setIsSubmitting(true)

    const result =
      mode === 'signup'
        ? await registerParentAccountAction(email, password)
        : await parentLoginAction(email, password)

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Đăng nhập thất bại')
      if (result.isLocked) {
        setIsLocked(true)
        setLockoutSeconds(result.lockoutSeconds ?? 60)
      }
      return
    }

    router.replace('/parent')
  }

  if (mode === 'loading') {
    return (
      <div className="fixed inset-0 flex min-h-dvh items-center justify-center bg-shell-dark">
        <div className="text-4xl">🛡️</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-shell-dark p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <div className="mb-3 text-5xl" aria-hidden="true">
            👨‍👩‍👦
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">{heading}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'signup'
              ? 'Tạo tài khoản lần đầu để quản lý ứng dụng cho bé.'
              : 'Dùng email và mật khẩu để vào Parent Mode.'}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="parent-email">
              Email
            </label>
            <input
              id="parent-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none ring-blue-500 focus:ring-2"
              placeholder="parent@example.com"
              disabled={isSubmitting || isLocked}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="parent-password">
              Mật khẩu
            </label>
            <input
              id="parent-password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none ring-blue-500 focus:ring-2"
              placeholder="Tối thiểu 8 ký tự"
              disabled={isSubmitting || isLocked}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submit()
                }
              }}
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}

        {isLocked ? (
          <p className="mt-3 text-sm font-semibold text-amber-700">
            Tạm khóa đăng nhập. Vui lòng thử lại sau {lockoutSeconds}s.
          </p>
        ) : null}

        <button
          onClick={() => void submit()}
          disabled={isSubmitting || isLocked}
          className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-3 text-base font-extrabold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Đang xử lý...' : mode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập'}
        </button>

        {mode === 'login' ? (
          <p className="mt-3 text-center text-xs text-slate-500">
            Phiên đăng nhập sẽ được duy trì tự động để bạn không cần đăng nhập thường xuyên.
          </p>
        ) : null}
      </div>
    </div>
  )
}
