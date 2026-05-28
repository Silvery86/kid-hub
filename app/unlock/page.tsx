'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkKidSessionAction, verifyKidPatternAction } from '@/server/actions/auth.actions'

const TILES = [
  { id: '1', emoji: '☀️', label: 'Sun' },
  { id: '2', emoji: '🚌', label: 'Bus' },
  { id: '3', emoji: '🐶', label: 'Dog' },
  { id: '4', emoji: '🍎', label: 'Apple' },
  { id: '5', emoji: '⭐', label: 'Star' },
  { id: '6', emoji: '🎈', label: 'Balloon' },
] as const

export default function UnlockPage() {
  const router = useRouter()
  const [entered, setEntered] = useState('')
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    checkKidSessionAction().then(({ hasSession, hasKidPatternSet }) => {
      if (hasSession) {
        router.replace('/dashboard')
        return
      }
      if (!hasKidPatternSet) {
        setError('Parent chưa thiết lập mã mở khóa cho bé. Vui lòng vào Parent Mode.')
      }
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

  const hint = useMemo(() => {
    if (isLocked) return `Vui lòng thử lại sau ${lockoutSeconds}s`
    return `${entered.length}/2`
  }, [entered.length, isLocked, lockoutSeconds])

  const submitPattern = async (pattern: string) => {
    setIsSubmitting(true)
    const result = await verifyKidPatternAction(pattern)
    setIsSubmitting(false)

    if (result.success) {
      router.replace('/dashboard')
      return
    }

    if (result.isLocked) {
      setIsLocked(true)
      setLockoutSeconds(result.lockoutSeconds ?? 30)
      setEntered('')
      setError('Đã nhập sai quá nhiều lần.')
      return
    }

    setEntered('')
    setError(result.error ?? 'Mã mở khóa chưa đúng, thử lại nhé!')
  }

  const handleTap = (id: string) => {
    if (isLocked || isSubmitting) return
    const next = `${entered}${id}`
    setEntered(next)
    setError('')

    if (next.length === 2) {
      void submitPattern(next)
    }
  }

  return (
    <div className="fixed inset-0 flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#bfdbfe_30%,#1e293b_100%)] p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white/95 p-6 shadow-2xl">
        <div className="mb-4 text-center">
          <div className="mb-2 text-6xl" aria-hidden="true">
            🔓
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Mở khóa cho bé</h1>
          <p className="mt-1 text-sm text-slate-500">Chạm 2 hình theo đúng thứ tự đã cài đặt</p>
          <p className="mt-2 text-sm font-bold text-sky-700">{hint}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {TILES.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTap(tile.id)}
              disabled={isLocked || isSubmitting}
              className="flex min-h-24 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-4xl transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={tile.label}
            >
              {tile.emoji}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm font-semibold text-rose-600">{error}</p>
        ) : (
          <p className="mt-4 text-center text-xs text-slate-500">Nhấn nút Bố mẹ để vào khu quản lý</p>
        )}

        <button
          className="mt-4 w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-700"
          onClick={() => router.push('/parent')}
        >
          👨‍👩‍👦 Bố mẹ
        </button>
      </div>
    </div>
  )
}
