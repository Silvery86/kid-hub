'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  checkParentPinAction,
  checkParentSessionAction,
  clearParentAccessAction,
  parentLoginAction,
  registerParentAccountAction,
  setPinAction,
} from '@/server/actions/auth.actions'
import { ParentPinKeypad, type ParentPinKeypadSize } from '@/components/parent/parent-pin/ParentPinKeypad'
import {
  ParentLoginStepIndicator,
  type ParentLoginStep,
} from './ParentLoginStepIndicator'

const FEATURES = [
  { icon: '📅', title: 'Quản lý lịch học', desc: 'Thêm, sửa, xóa thời khóa biểu của Khôi' },
  { icon: '🌟', title: 'Cập nhật điểm số', desc: 'Nhập điểm từng môn, xem xếp loại tự động' },
  { icon: '🔒', title: 'Bảo mật bằng PIN', desc: '4 chữ số · mã hóa an toàn · không ai xem được' },
] as const

function useLoginViewportSize(): ParentPinKeypadSize {
  const [size, setSize] = useState<ParentPinKeypadSize>('md')
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= 1024) setSize('lg')
      else if (w < 480) setSize('sm')
      else setSize('md')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

export function ParentLoginView() {
  const router = useRouter()
  const keypadSize = useLoginViewportSize()
  const [step, setStep] = useState<ParentLoginStep>('email')
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftPin, setDraftPin] = useState('')
  const [pinErrorCount, setPinErrorCount] = useState(0)
  const [pinMismatch, setPinMismatch] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    void (async () => {
      const [{ hasSession, hasParentAccount }, { hasPin }] = await Promise.all([
        checkParentSessionAction(),
        checkParentPinAction(),
      ])
      if (hasSession && hasPin) {
        router.replace('/parent')
        return
      }
      if (hasSession && !hasPin) {
        setStep('welcome')
        setIsReady(true)
        return
      }
      setIsSignup(!hasParentAccount)
      setIsReady(true)
    })()
  }, [router])

  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return
    const timer = setInterval(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          setIsLocked(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isLocked, lockoutSeconds])

  const handleEmailSubmit = async () => {
    if (isLocked || isSubmitting) return
    setError('')
    setIsSubmitting(true)

    if (isSignup) {
      const signupResult = await registerParentAccountAction(email, password)
      setIsSubmitting(false)
      if (!signupResult.success) {
        setError(signupResult.error ?? 'Không thể tạo tài khoản')
        return
      }
    } else {
      const loginResult = await parentLoginAction(email, password)
      setIsSubmitting(false)
      if (!loginResult.success) {
        setError(loginResult.error ?? 'Đăng nhập thất bại')
        if (loginResult.isLocked) {
          setIsLocked(true)
          setLockoutSeconds(loginResult.lockoutSeconds ?? 60)
        }
        return
      }
    }

    const { hasPin } = await checkParentPinAction()
    if (hasPin) {
      await clearParentAccessAction()
      router.replace('/parent/pin')
      return
    }
    setStep('welcome')
  }

  const handleCreatePin = useCallback((pin: string) => {
    setDraftPin(pin)
    setPinMismatch(false)
    setStep('confirm')
  }, [])

  const handleConfirmPin = useCallback(
    async (pin: string) => {
      if (pin !== draftPin) {
        setPinMismatch(true)
        setPinErrorCount((c) => c + 1)
        return
      }
      setIsSubmitting(true)
      const result = await setPinAction(pin)
      setIsSubmitting(false)
      if (!result.success) {
        setError(result.error ?? 'Không thể lưu PIN')
        return
      }
      setStep('success')
    },
    [draftPin]
  )

  if (!isReady) {
    return (
      <div className="fixed inset-0 flex min-h-dvh items-center justify-center bg-shell-dark">
        <div className="text-5xl" aria-hidden="true">
          🛡️
        </div>
      </div>
    )
  }

  const isCompact = keypadSize === 'sm'

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-shell-dark px-4 py-6 md:py-8 lg:py-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 md:gap-8">
        {step !== 'success' ? (
          <ParentLoginStepIndicator step={step} compact={isCompact} />
        ) : null}

        {step === 'email' ? (
          <div className="flex w-full max-w-md flex-col items-center gap-4 text-white md:gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-blue-500 text-3xl shadow-lg shadow-blue-500/40 md:h-[72px] md:w-[72px] md:text-4xl">
              🌟
            </div>
            <div className="text-center">
              <div className="text-2xl font-black tracking-tight md:text-[28px]">Kid Hub</div>
              <div className="mt-1 text-sm font-bold text-slate-400 md:text-base">
                {isSignup ? 'Thiết lập tài khoản phụ huynh' : 'Đăng nhập vào tài khoản phụ huynh'}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isLocked}
                  placeholder="email@example.com"
                  className="h-11 w-full rounded-[14px] border-2 border-white/10 bg-white/5 px-4 text-sm font-bold text-white outline-none focus:border-blue-400 md:h-[54px] md:text-base"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                  Mật khẩu
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isLocked}
                    placeholder="Tối thiểu 8 ký tự"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleEmailSubmit()
                    }}
                    className="h-11 w-full rounded-[14px] border-2 border-white/10 bg-white/5 px-4 pr-11 text-sm font-bold text-white outline-none focus:border-blue-400 md:h-[54px] md:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-lg text-slate-500"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>
            </div>

            {error ? <p className="text-sm font-bold text-rose-400">{error}</p> : null}
            {isLocked ? (
              <p className="text-sm font-bold text-amber-400">
                Tạm khóa đăng nhập. Thử lại sau {lockoutSeconds}s.
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleEmailSubmit()}
              disabled={isSubmitting || isLocked}
              className="w-full rounded-full border-4 border-blue-800 bg-blue-500 py-3 text-base font-black text-white shadow-lg shadow-blue-500/50 disabled:opacity-60 md:py-3.5"
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : isSignup
                  ? 'Tạo tài khoản'
                  : 'Đăng nhập'}
            </button>
            <p className="text-center text-xs font-bold text-slate-600">
              Lần đầu đăng nhập? Hãy tạo mã PIN sau khi xác thực.
            </p>
          </div>
        ) : null}

        {step === 'welcome' ? (
          <div className="flex w-full max-w-lg flex-col items-center gap-4 text-center text-white md:gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-blue-500 text-4xl shadow-lg shadow-blue-500/50 md:h-20 md:w-20 md:text-5xl">
              🌟
            </div>
            <div>
              <div className="text-2xl font-black md:text-[32px]">Xin chào Bố / Mẹ! 👋</div>
              <div className="mt-2 text-sm font-bold text-slate-400 md:text-base">
                Hãy tạo mã PIN để bảo vệ chế độ quản lý của bạn.
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              {FEATURES.map((f) => (
                <div
                  key={f.icon}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xl">
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-sm font-black md:text-base">{f.title}</div>
                    <div className="text-xs font-bold text-slate-400 md:text-sm">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep('create')}
              className="rounded-full border-4 border-blue-800 bg-blue-500 px-8 py-3 text-base font-black text-white shadow-lg shadow-blue-500/50"
            >
              Bắt đầu tạo PIN →
            </button>
          </div>
        ) : null}

        {step === 'create' ? (
          <div className="flex flex-col items-center gap-5 text-white">
            <div className="text-center">
              <div className="text-2xl font-black md:text-[28px]">Tạo mã PIN mới</div>
              <div className="mt-2 text-sm font-bold text-slate-400 md:text-base">
                Chọn 4 chữ số cho mã PIN của bạn
              </div>
            </div>
            <ParentPinKeypad size={keypadSize} onComplete={handleCreatePin} isDisabled={isSubmitting} />
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="text-sm font-bold text-slate-500"
            >
              ← Quay lại
            </button>
          </div>
        ) : null}

        {step === 'confirm' ? (
          <div className="flex flex-col items-center gap-5 text-white">
            <div className="text-center">
              <div className="text-2xl font-black md:text-[28px]">Xác nhận mã PIN</div>
              <div className="mt-2 text-sm font-bold text-slate-400 md:text-base">
                {pinMismatch
                  ? 'Mã PIN không khớp. Hãy nhập lại.'
                  : 'Nhập lại mã PIN vừa tạo để xác nhận'}
              </div>
            </div>
            <ParentPinKeypad
              size={keypadSize}
              onComplete={handleConfirmPin}
              errorCount={pinErrorCount}
              isDisabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => {
                setDraftPin('')
                setStep('create')
              }}
              className="text-sm font-bold text-slate-500"
            >
              ← Quay lại
            </button>
          </div>
        ) : null}

        {step === 'success' ? (
          <div className="flex max-w-md flex-col items-center gap-5 text-center text-white md:gap-6">
            <div className="text-7xl md:text-[90px]" aria-hidden="true">
              ✅
            </div>
            <div>
              <div className="text-2xl font-black md:text-[30px]">Đã tạo PIN thành công!</div>
              <div className="mt-2 text-sm font-bold text-slate-400 md:text-base">
                Mã PIN của bạn đã được lưu an toàn. Bạn có thể quản lý lịch học và điểm số của Khôi
                ngay bây giờ.
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['📅 Lịch học', '🌟 Điểm số', '🔒 PIN bảo mật'].map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-extrabold text-slate-300 md:text-sm"
                >
                  {label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.replace('/parent')}
              className="rounded-full border-4 border-blue-800 bg-blue-500 px-8 py-3 text-base font-black text-white shadow-lg shadow-blue-500/50"
            >
              Vào Parent Mode 🚀
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
