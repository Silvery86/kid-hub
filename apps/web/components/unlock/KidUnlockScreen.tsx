'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { checkKidSessionAction, verifyKidPatternAction } from '@/server/actions/auth.actions'
import { cn } from '@/lib/utils'

const TILES = [
  { id: '1', emoji: '☀️', label: 'Sun' },
  { id: '2', emoji: '🚌', label: 'Bus' },
  { id: '3', emoji: '🐶', label: 'Dog' },
  { id: '4', emoji: '🍎', label: 'Apple' },
  { id: '5', emoji: '⭐', label: 'Star' },
  { id: '6', emoji: '🎈', label: 'Balloon' },
] as const

export function KidUnlockScreen() {
  const router = useRouter()
  const [entered, setEntered] = useState('')
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    checkKidSessionAction().then(({ hasSession, hasKidPatternSet }) => {
      if (hasSession) {
        router.replace('/dashboard')
        return
      }
      if (!hasKidPatternSet) {
        setNeedsSetup(true)
        setError('Bố mẹ chưa thiết lập mã mở khóa. Vui lòng vào Parent Mode.')
      }
    })
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
    if (isLocked || isSubmitting || needsSetup) return
    const next = `${entered}${id}`
    setEntered(next)
    setError('')

    if (next.length === 2) {
      void submitPattern(next)
    }
  }

  return (
    <div className="fixed inset-0 flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#bfdbfe_35%,#0f172a_100%)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 text-7xl leading-none" aria-hidden="true">
            🔓
          </div>
          <h1 className="text-3xl font-black text-white">Mở khóa cho bé</h1>
          <p className="mt-2 text-sm font-bold text-slate-300">
            Chạm 2 hình theo đúng thứ tự đã cài đặt
          </p>
          <p className="mt-3 text-sm font-extrabold text-sky-300">{hint}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {TILES.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTap(tile.id)}
              disabled={isLocked || isSubmitting || needsSetup}
              className={cn(
                'flex min-h-24 items-center justify-center rounded-2xl border-2 text-4xl transition active:scale-[0.97]',
                'border-white/20 bg-white/10 text-white backdrop-blur-sm',
                'hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50'
              )}
              aria-label={tile.label}
            >
              {tile.emoji}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm font-bold text-rose-300">{error}</p>
        ) : (
          <p className="mt-4 text-center text-xs font-bold text-slate-500">
            Nhấn nút Bố mẹ để vào khu quản lý
          </p>
        )}

        <Link
          href="/parent/login"
          className="mt-5 flex w-full items-center justify-center rounded-2xl bg-white/10 px-4 py-3.5 text-sm font-extrabold text-white ring-2 ring-white/20 transition hover:bg-white/15"
        >
          👨‍👩‍👦 Bố mẹ
        </Link>
      </div>
    </div>
  )
}
