'use client'

/**
 * Kid unlock pattern — set it, or replace the one already stored.
 *
 * `saved` used to be local state only, so the card opened as "not set" on every
 * page load: a parent who had already chosen a pattern refreshed and was told,
 * in effect, that they had not. Whether one exists is server state, so it
 * arrives as a prop and survives a reload.
 *
 * The stored pattern itself is never shown, because it cannot be — it is a
 * bcrypt hash, not a recoverable value. The card says so rather than leaving a
 * parent hunting for the two symbols they picked.
 */

import { useMemo, useState } from 'react'
import { Check, Lock, RotateCcw } from 'lucide-react'
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
  initialHasPattern = false,
  onSaved,
}: {
  compact?: boolean
  /** Whether the active student already has a pattern stored. */
  initialHasPattern?: boolean
  onSaved?: () => void
}) {
  const [hasPattern, setHasPattern] = useState(initialHasPattern)
  // A stored pattern is shown as done; the pad only opens when asked for.
  const [editing, setEditing] = useState(!initialHasPattern)
  const [firstPattern, setFirstPattern] = useState('')
  const [confirmPattern, setConfirmPattern] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const activePattern = useMemo(() => {
    if (firstPattern.length < 2) return firstPattern
    return confirmPattern
  }, [firstPattern, confirmPattern])

  const clearDraft = () => {
    setFirstPattern('')
    setConfirmPattern('')
    setError('')
  }

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

    // Settles into the stored state without a reload, and stays there after one.
    clearDraft()
    setHasPattern(true)
    setEditing(false)
    setJustSaved(true)
    onSaved?.()
  }

  const startOver = () => {
    clearDraft()
    setJustSaved(false)
    setEditing(true)
  }

  const cancelEdit = () => {
    clearDraft()
    setEditing(false)
  }

  return (
    <div className={cn('rounded-[22px] bg-white shadow-sm', compact ? 'p-3.5' : 'p-5')}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className={cn('font-black text-slate-700', compact ? 'text-base' : 'text-lg')}>
            🔓 Mã mở khóa cho bé
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500 md:text-sm">
            {editing
              ? 'Chọn 2 hình theo thứ tự — bé dùng mẫu này khi mở app'
              : 'Bé dùng mẫu này khi mở app'}
          </p>
        </div>
        {hasPattern && !editing ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
            <Check size={13} /> {justSaved ? 'Đã lưu' : 'Đã thiết lập'}
          </span>
        ) : null}
      </div>

      {hasPattern && !editing ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-slate-500">
              <Lock size={16} />
            </span>
            <p className="text-xs font-bold text-slate-600">
              Đã có mã mở khóa cho bé. Vì lý do bảo mật, mã đã được mã hóa nên
              không hiển thị lại được — nếu quên, hãy đặt mã mới.
            </p>
          </div>
          <button
            type="button"
            onClick={startOver}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            <RotateCcw size={15} /> Đặt lại mã
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-sm font-bold text-slate-600">
              Tiến trình: {activePattern.length}/2
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-sm font-extrabold text-blue-600"
                onClick={clearDraft}
              >
                Chọn lại
              </button>
              {/* Only offered when there is something to go back to — otherwise
                  cancelling would leave the child with no way into the app. */}
              {hasPattern ? (
                <button
                  type="button"
                  className="text-sm font-extrabold text-slate-500"
                  onClick={cancelEdit}
                >
                  Hủy
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SYMBOLS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => void handleTap(s.id)}
                disabled={isSubmitting}
                className={cn(
                  'flex min-h-20 items-center justify-center rounded-2xl border-2 border-slate-100 bg-slate-50 text-3xl transition hover:bg-slate-100 disabled:opacity-60',
                  compact && 'min-h-16 text-2xl'
                )}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {error ? <p className="mt-3 text-sm font-bold text-rose-600">{error}</p> : null}
    </div>
  )
}
