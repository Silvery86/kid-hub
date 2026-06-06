'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { completeHomeworkAction } from '@/server/actions/homework.actions'
import { getSubjectById } from '@/lib/data/subjects'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'
import type { HomeworkItem } from '@/types'

interface HomeworkModeProps {
  initialItems: HomeworkItem[]
}

export const HomeworkMode = ({ initialItems }: HomeworkModeProps) => {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()
  const [showCelebration, setShowCelebration] = useState(false)

  const doneCount = items.filter((i) => i.isDone).length
  const total = items.length
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const handleDone = (periodId: string) => {
    startTransition(async () => {
      const updated = items.map((i) => (i.periodId === periodId ? { ...i, isDone: true } : i))
      setItems(updated)
      await completeHomeworkAction(periodId)
      if (updated.every((i) => i.isDone)) {
        setShowCelebration(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    })
  }

  if (total === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-shell-kid p-6 text-center">
        <div className="text-8xl" aria-hidden="true">
          🎉
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary">Không có bài tập!</h1>
        <p className="text-text-secondary">Hôm nay rảnh rỗi, chơi game nào.</p>
        <Link
          href="/dashboard"
          className="mt-4 rounded-pill bg-btn-primary px-6 py-3 font-bold text-white"
        >
          Về trang chính
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-shell-kid p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex min-h-tap min-w-tap items-center justify-center rounded-2xl bg-white shadow-sm"
          aria-label="Quay lại"
        >
          <ArrowLeft size={22} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">📚 Bài tập hôm nay</h1>
          <p className="text-sm text-text-secondary">
            {doneCount} / {total} bài đã xong
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-3 w-full overflow-hidden rounded-pill bg-progress-track">
        <div
          className="h-full rounded-pill bg-progress-high transition-all duration-500"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Homework items */}
      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const subject = getSubjectById(item.subjectId)
          return (
            <div
              key={item.periodId}
              className={cn(
                'rounded-card bg-white p-5 shadow-sm transition-opacity duration-300',
                item.isDone && 'opacity-60'
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    'h-10 w-10 shrink-0 rounded-2xl',
                    subject?.colorClass ?? 'bg-slate-300'
                  )}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p
                    className={cn(
                      'font-extrabold text-slate-700',
                      item.isDone && 'line-through text-text-muted'
                    )}
                  >
                    {subject?.name ?? item.subjectId}
                  </p>
                  {item.homeworkNote && (
                    <p className="mt-0.5 text-sm text-text-secondary">{item.homeworkNote}</p>
                  )}
                </div>
                {item.isDone && (
                  <CheckCircle2 className="shrink-0 text-btn-secondary" size={24} />
                )}
              </div>

              {!item.isDone && (
                <KidButton
                  variant="secondary"
                  onClick={() => handleDone(item.periodId)}
                  isDisabled={isPending}
                  className="w-full min-h-tap-lg text-lg font-extrabold"
                >
                  ✅ XONG RỒI!
                </KidButton>
              )}
            </div>
          )
        })}
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-white/90">
          <div className="text-center">
            <div className="mb-4 text-8xl" aria-hidden="true">
              🎉
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800">Xong hết rồi!</h2>
            <p className="mt-2 text-xl text-text-secondary">Giỏi lắm Khôi! ⭐</p>
          </div>
        </div>
      )}
    </div>
  )
}
