'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setKidPatternAction } from '@/server/actions/auth.actions'

const SYMBOLS = [
  { id: '1', emoji: '☀️' },
  { id: '2', emoji: '🚌' },
  { id: '3', emoji: '🐶' },
  { id: '4', emoji: '🍎' },
  { id: '5', emoji: '⭐' },
  { id: '6', emoji: '🎈' },
] as const

export default function KidAccessSetupPage() {
  const router = useRouter()
  const [firstPattern, setFirstPattern] = useState('')
  const [confirmPattern, setConfirmPattern] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const activePattern = useMemo(() => {
    if (firstPattern.length < 2) return firstPattern
    return confirmPattern
  }, [firstPattern, confirmPattern])

  const handleTap = async (symbol: string) => {
    if (isSubmitting) return

    if (firstPattern.length < 2) {
      const next = `${firstPattern}${symbol}`
      setFirstPattern(next)
      if (next.length === 2) {
        setError('Xác nhận lại mẫu vừa chọn.')
      }
      return
    }

    const next = `${confirmPattern}${symbol}`
    setConfirmPattern(next)

    if (next.length < 2) return

    if (next !== firstPattern) {
      setError('Hai lần chọn không khớp. Vui lòng chọn lại.')
      setFirstPattern('')
      setConfirmPattern('')
      return
    }

    setIsSubmitting(true)
    const result = await setKidPatternAction(next)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Không thể lưu mẫu mở khóa')
      setFirstPattern('')
      setConfirmPattern('')
      return
    }

    router.replace('/parent')
  }

  const reset = () => {
    setFirstPattern('')
    setConfirmPattern('')
    setError('')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center p-6">
      <div className="w-full rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-extrabold text-slate-800">Thiết lập mở khóa cho bé</h1>
        <p className="mt-2 text-sm text-slate-500">
          Chọn 2 hình theo thứ tự. Bé sẽ dùng mẫu này để vào màn hình học.
        </p>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">Tiến trình: {activePattern.length}/2</p>
          <button className="text-sm font-bold text-blue-600 hover:text-blue-700" onClick={reset}>
            Chọn lại
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              onClick={() => void handleTap(s.id)}
              disabled={isSubmitting}
              className="flex min-h-24 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-4xl transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {s.emoji}
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}
      </div>
    </div>
  )
}
