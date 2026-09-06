'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { acceptInviteAction } from '@/server/actions/invites.actions'

/** Every failure the server distinguishes, in words a parent can act on. */
const OUTCOME: Record<string, string> = {
  invalid: 'Mã mời không đúng hoặc đã hết hạn.',
  'already-linked': 'Bạn đã có quyền với bé này rồi.',
  'wrong-account': 'Mã mời này dành cho một email khác.',
}

export function AcceptInviteView() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = useCallback(async () => {
    if (isSubmitting) return
    setError('')
    setIsSubmitting(true)

    const result = await acceptInviteAction(code)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Không dùng được mã mời')
      return
    }
    if (result.data.status !== 'ok') {
      setError(OUTCOME[result.data.status] ?? 'Không dùng được mã mời')
      return
    }
    router.replace('/parent/students')
  }, [code, isSubmitting, router])

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:px-6">
      <h1 className="m-0 text-2xl font-black tracking-tight text-slate-800">🤝 Nhận lời mời</h1>
      <p className="mt-1 mb-5 text-sm font-bold text-slate-500">
        Nhập mã bố hoặc mẹ đã gửi để cùng quản lý bé.
      </p>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="VD: K7QM2XPA"
        autoCapitalize="characters"
        autoComplete="off"
        className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-center font-mono text-lg font-black tracking-[0.2em] text-slate-800 focus:border-blue-400 focus:outline-none"
      />

      {error ? (
        <p role="alert" className="mt-3 text-sm font-bold text-rose-600">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={isSubmitting || code.length < 4}
        className="mt-4 w-full rounded-full bg-blue-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/30 disabled:opacity-50"
      >
        {isSubmitting ? 'Đang kiểm tra…' : 'Dùng mã này'}
      </button>

      <Link
        href="/parent/students"
        className="mt-4 block text-center text-xs font-bold text-slate-400 underline"
      >
        Quay lại danh sách bé
      </Link>
    </div>
  )
}
