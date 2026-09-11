'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { checkKidSessionAction, verifyKidPatternAction } from '@/server/actions/auth.actions'
import { cn } from '@/lib/utils'
import { STAGGER_TIGHT } from '@/lib/motion'

const TILES = [
  { id: '1', emoji: '☀️', label: 'Sun' },
  { id: '2', emoji: '🚌', label: 'Bus' },
  { id: '3', emoji: '🐶', label: 'Dog' },
  { id: '4', emoji: '🍎', label: 'Apple' },
  { id: '5', emoji: '⭐', label: 'Star' },
  { id: '6', emoji: '🎈', label: 'Balloon' },
] as const

export interface UnlockableStudent {
  id: string
  name: string
}

/**
 * `studentId` is resolved on the server: the unlock screen is only reachable
 * with a parent session (D1), so which child is being unlocked starts as a
 * decision the server already made. With more than one child the picker lets
 * the household correct it before the pattern is entered.
 */
export function KidUnlockScreen({
  studentId: initialStudentId,
  students = [],
}: {
  studentId: string
  students?: UnlockableStudent[]
}) {
  const [studentId, setStudentId] = useState(initialStudentId)
  const router = useRouter()
  const [entered, setEntered] = useState('')
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    checkKidSessionAction(studentId).then(({ hasSession, hasKidPatternSet }) => {
      if (hasSession) {
        router.replace('/dashboard')
        return
      }
      // Each child has their own pattern, so this has to be re-checked when the
      // picker changes the student — not only on first mount.
      setNeedsSetup(!hasKidPatternSet)
      setError(hasKidPatternSet ? '' : 'Bố mẹ chưa thiết lập mã mở khóa. Vui lòng vào Parent Mode.')
    })
  }, [router, studentId])

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
    const result = await verifyKidPatternAction(studentId, pattern)
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
          <p className="mt-2 text-sm font-bold text-text-subtle">
            Chạm 2 hình theo đúng thứ tự đã cài đặt
          </p>
          <p className="mt-3 text-sm font-extrabold text-math-light">{hint}</p>
        </div>

        {students.length > 1 ? (
          <div className="mb-5 flex flex-wrap justify-center gap-2">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setStudentId(student.id)
                  setEntered('')
                  setError('')
                }}
                aria-pressed={student.id === studentId}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-black transition-colors',
                  student.id === studentId
                    ? 'bg-white text-slate-800'
                    : 'bg-white/15 text-white hover:bg-white/25'
                )}
              >
                {student.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          {TILES.map((tile, i) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTap(tile.id)}
              disabled={isLocked || isSubmitting || needsSetup}
              // The press and the error shake were already here; the pad simply
              // appeared. Arriving in sequence makes it read as something to
              // play with rather than a form to fill in.
              style={{ animationDelay: `${i * STAGGER_TIGHT}ms` }}
              className={cn(
                'animate-pop-in',
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
          <p className="mt-4 text-center text-sm font-bold text-btn-danger">{error}</p>
        ) : (
          <p className="mt-4 text-center text-xs font-bold text-text-secondary">
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
