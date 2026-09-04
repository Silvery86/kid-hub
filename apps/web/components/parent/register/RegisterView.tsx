'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'

import { applyForAccountAction } from '@/server/actions/auth.actions'

/**
 * Open signup. Ends on a waiting screen, never a session: the account is created
 * PENDING and an admin has to approve it before it can be signed into (D4).
 */
export function RegisterView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [childName, setChildName] = useState('')
  const [gradeLevel, setGradeLevel] = useState(1)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setError('')
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
  }, [email, password, childName, gradeLevel, isSubmitting])

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12 text-center">
        <div className="text-6xl" aria-hidden="true">
          ⏳
        </div>
        <h1 className="m-0 text-2xl font-black text-white">Đã gửi đăng ký</h1>
        <p className="m-0 text-sm font-bold leading-relaxed text-slate-300">
          Tài khoản của bạn đang chờ quản trị viên duyệt. Bạn sẽ đăng nhập được ngay sau khi
          được duyệt.
        </p>
        <Link
          href="/parent/login"
          className="rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/40"
        >
          Về trang đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-12">
      <header className="text-center">
        <h1 className="m-0 text-2xl font-black text-white">Tạo tài khoản phụ huynh</h1>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Tài khoản cần được quản trị viên duyệt trước khi sử dụng.
        </p>
      </header>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="email@example.com"
          className="rounded-2xl border-2 border-slate-700 bg-slate-800 px-4 py-3.5 text-base font-bold text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Mật khẩu
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          className="rounded-2xl border-2 border-slate-700 bg-slate-800 px-4 py-3.5 text-base font-bold text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
          Bé của bạn
        </legend>
        <div className="flex gap-2">
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Tên của bé"
            className="min-w-0 flex-1 rounded-2xl border-2 border-slate-700 bg-slate-800 px-4 py-3.5 text-base font-bold text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(Number(e.target.value))}
            aria-label="Lớp"
            className="shrink-0 rounded-2xl border-2 border-slate-700 bg-slate-800 px-3 py-3.5 text-base font-bold text-white focus:border-blue-500 focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="m-0 text-sm font-bold text-rose-400">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="rounded-full bg-blue-500 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-500/40 disabled:opacity-50"
      >
        {isSubmitting ? 'Đang gửi…' : 'Gửi đăng ký'}
      </button>

      <Link href="/parent/login" className="text-center text-xs font-bold text-slate-400 underline">
        Đã có tài khoản? Đăng nhập
      </Link>
    </div>
  )
}
