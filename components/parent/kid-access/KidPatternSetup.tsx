'use client'

import { useMemo, useState } from 'react'
import { setKidPatternAction } from '@/server/actions/auth.actions'
import { cn } from '@/lib/utils'

const SYMBOLS = [
  { id: '1', emoji: '☀️' },
  { id: '2', emoji: '🚌' },
  { id: '3', emoji: '🐶' },
  { id: '4', emoji: '🍎' },
  { id: '5', emoji: '⭐' },
  { id: '6', emoji: '🎈' },
] as const

export function KidPatternSetup({
  compact = false,
  onSaved,
}: {
  compact?: boolean
  onSaved?: () => void
}) {
  const [firstPattern, setFirstPattern] = useState('')
  const [confirmPattern, setConfirmPattern] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const activePattern = useMemo(() => {
    if (firstPattern.length < 2) return firstPattern
    return confirmPattern
  }, [firstPattern, confirmPattern])

  const handleTap = async (symbol: string) => {
    if (isSubmitting || saved) return

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

    setSaved(true)
    setError('')
    onSaved?.()
  }

  const reset = () => {
    setFirstPattern('')
    setConfirmPattern('')
    setError('')
    setSaved(false)
  }

  return (
    <div
      className={cn(
        'rounded-[22px] bg-white shadow-sm',
        compact ? 'p-3.5' : 'p-5'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className={cn('font-black text-slate-700', compact ? 'text-base' : 'text-lg')}>
            🔓 Mã mở khóa cho bé
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500 md:text-sm">
            Chọn 2 hình theo thứ tự — bé dùng mẫu này khi mở app
          </p>
        </div>
        {saved ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
            Đã lưu ✓
          </span>
        ) : null}
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
        <p className="text-sm font-bold text-slate-600">Tiến trình: {activePattern.length}/2</p>
        <button
          type="button"
          className="text-sm font-extrabold text-blue-600"
          onClick={reset}
        >
          Chọn lại
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SYMBOLS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => void handleTap(s.id)}
            disabled={isSubmitting || saved}
            className={cn(
              'flex min-h-20 items-center justify-center rounded-2xl border-2 border-slate-100 bg-slate-50 text-3xl transition hover:bg-slate-100 disabled:opacity-60',
              compact && 'min-h-16 text-2xl'
            )}
          >
            {s.emoji}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm font-bold text-rose-600">{error}</p> : null}
    </div>
  )
}
