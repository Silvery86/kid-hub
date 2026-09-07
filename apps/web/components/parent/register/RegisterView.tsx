'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { RegisterSchema } from '@kid-hub/shared'

import { applyForAccountAction } from '@/server/actions/auth.actions'

type FieldName = 'email' | 'password' | 'student.name' | 'student.gradeLevel'

/** A field turns rose only once its error is actually being shown. */
const fieldClass = (invalid: boolean): string =>
  [
    'h-11 w-full rounded-[14px] border-2 px-4 text-sm font-bold text-white outline-none',
    'md:h-[54px] md:text-base',
    invalid
      ? 'border-rose-500/70 bg-rose-500/10 focus:border-rose-400'
      : 'border-white/10 bg-white/5 focus:border-blue-400',
  ].join(' ')

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-bold text-rose-400">
      {message}
    </p>
  )
}

/**
 * Open signup. Ends on a waiting screen, never a session: the account is created
 * PENDING and an admin has to approve it before it can be signed into (D4).
 *
 * Deliberately mirrors ParentLoginView's shell — same dark full-bleed surface,
 * same field styling, same pill button — because these two screens are one flow
 * with a link between them, and a visitor moving across should not feel handed
 * to a different product.
 */
export function RegisterView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [childName, setChildName] = useState('')
  const [gradeLevel, setGradeLevel] = useState(1)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  /** Fields the user has finished with. Errors stay hidden until then. */
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [attempted, setAttempted] = useState(false)

  /**
   * Validated against the same schema the Server Action uses, so the form can
   * never accept something the server will reject — or reject something it
   * would have accepted.
   */
  const fieldErrors = useMemo(() => {
    const result = RegisterSchema.safeParse({
      email,
      password,
      student: { name: childName, gradeLevel },
    })
    if (result.success) return {} as Partial<Record<FieldName, string>>

    const errors: Partial<Record<FieldName, string>> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') as FieldName
      // First issue per field: later ones are usually consequences of the first.
      errors[key] ??= issue.message
    }
    return errors
  }, [email, password, childName, gradeLevel])

  const isValid = Object.keys(fieldErrors).length === 0

  // Nagging someone mid-word is worse than no validation at all, so an error
  // only appears once they have left the field or tried to submit.
  const errorFor = (field: FieldName): string | undefined =>
    touched[field] || attempted ? fieldErrors[field] : undefined

  const markTouched = (field: FieldName) => setTouched((t) => ({ ...t, [field]: true }))

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setAttempted(true)
    setError('')
    if (!isValid) return

    setIsSubmitting(true)

    const result = await applyForAccountAction(email, password, {
      name: childName,
      gradeLevel,
    })
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Không gửi được đăng ký')
      return
    }
    setSubmitted(true)
  }, [email, password, childName, gradeLevel, isSubmitting, isValid])

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-shell-dark px-4 py-6 md:py-8">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center text-white md:gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-emerald-500 text-3xl shadow-lg shadow-emerald-500/40 md:h-[72px] md:w-[72px] md:text-4xl">
            ⏳
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight md:text-[28px]">Đã gửi đăng ký</div>
            <div className="mt-2 text-sm font-bold text-slate-400 md:text-base">
              Tài khoản của bạn đang chờ quản trị viên duyệt. Bạn sẽ đăng nhập được ngay sau
              khi được duyệt.
            </div>
          </div>
          <Link
            href="/parent/login"
            className="mt-2 w-full rounded-full border-4 border-blue-800 bg-blue-500 py-3 text-center text-base font-black text-white shadow-lg shadow-blue-500/50 md:py-3.5"
          >
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-shell-dark px-4 py-6 md:py-8 lg:py-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 md:gap-8">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-white md:gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-blue-500 text-3xl shadow-lg shadow-blue-500/40 md:h-[72px] md:w-[72px] md:text-4xl">
            🌟
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight md:text-[28px]">Kid Hub</div>
            <div className="mt-1 text-sm font-bold text-slate-400 md:text-base">
              Tạo tài khoản phụ huynh
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
                onBlur={() => markTouched('email')}
                disabled={isSubmitting}
                placeholder="email@example.com"
                aria-invalid={Boolean(errorFor('email'))}
                aria-describedby={errorFor('email') ? 'register-email-error' : undefined}
                className={fieldClass(Boolean(errorFor('email')))}
              />
              <FieldError id="register-email-error" message={errorFor('email')} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                Mật khẩu
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched('password')}
                  disabled={isSubmitting}
                  placeholder="Tối thiểu 8 ký tự"
                  aria-invalid={Boolean(errorFor('password'))}
                  aria-describedby={errorFor('password') ? 'register-password-error' : undefined}
                  className={`${fieldClass(Boolean(errorFor('password')))} pr-11`}
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
              <FieldError id="register-password-error" message={errorFor('password')} />
            </label>

            <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
              <legend className="mb-1.5 text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                Bé của bạn
              </legend>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  onBlur={() => markTouched('student.name')}
                  disabled={isSubmitting}
                  placeholder="Tên của bé"
                  aria-invalid={Boolean(errorFor('student.name'))}
                  aria-describedby={errorFor('student.name') ? 'register-child-error' : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSubmit()
                  }}
                  className={`${fieldClass(Boolean(errorFor('student.name')))} min-w-0 flex-1`}
                />
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                  disabled={isSubmitting}
                  aria-label="Lớp"
                  className="h-11 shrink-0 rounded-[14px] border-2 border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none focus:border-blue-400 md:h-[54px] md:text-base"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g} className="bg-shell-dark text-white">
                      Lớp {g}
                    </option>
                  ))}
                </select>
              </div>
              <FieldError id="register-child-error" message={errorFor('student.name')} />
            </fieldset>
          </div>

          {error ? <p className="text-sm font-bold text-rose-400">{error}</p> : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || (attempted && !isValid)}
            className="w-full rounded-full border-4 border-blue-800 bg-blue-500 py-3 text-base font-black text-white shadow-lg shadow-blue-500/50 disabled:opacity-60 md:py-3.5"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
          </button>

          <p className="text-center text-xs font-bold text-slate-400">
            Tài khoản cần được quản trị viên duyệt trước khi sử dụng.
          </p>
          <p className="text-center text-xs font-bold text-slate-400">
            Đã có tài khoản?{' '}
            <Link href="/parent/login" className="font-black text-blue-400 underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
