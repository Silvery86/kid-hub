'use client'

/** HomeworkCheckbox — large tap-target checkbox for a daily homework item. */

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIcon } from '@/lib/icons'
import { getSubjectById } from '@/lib/data/subjects'
import { toggleHomeworkDoneAction } from '@/server/actions/schedule.actions'
import { awardPointsAction } from '@/server/actions/rewards.actions'
import type { DailyHomework } from '@/types'

interface HomeworkCheckboxProps {
  item: DailyHomework
}

export const HomeworkCheckbox = ({ item }: HomeworkCheckboxProps) => {
  const [isDone, setIsDone] = useState(item.isDone)
  const [showPoints, setShowPoints] = useState(false)
  const [isPending, startTransition] = useTransition()

  const subject = getSubjectById(item.subjectId)
  const icon = getIcon(item.iconKey ?? item.subjectId)

  const handleToggle = () => {
    const next = !isDone
    setIsDone(next)

    startTransition(async () => {
      const result = await toggleHomeworkDoneAction(item.id, next)
      if (!result.success) {
        setIsDone(!next)
        return
      }
      if (next && result.data.points > 0) {
        await awardPointsAction(result.data.points)
        setShowPoints(true)
        setTimeout(() => setShowPoints(false), 2000)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isDone ? `Bỏ đánh dấu: ${item.label}` : `Đánh dấu hoàn thành: ${item.label}`}
      aria-pressed={isDone}
      className={cn(
        'flex min-h-[64px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left',
        'transition-colors active:scale-[0.97]',
        isDone ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'bg-amber-50 ring-1 ring-amber-200',
        isPending && 'opacity-70'
      )}
    >
      {/* Checkbox circle */}
      <span
        className={cn(
          'flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full border-2 transition-colors',
          isDone
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-amber-400 bg-white'
        )}
        aria-hidden
      >
        {isDone && <Check size={18} strokeWidth={3} />}
      </span>

      {/* Subject icon */}
      <span className="text-xl" aria-hidden>
        {icon.emoji}
      </span>

      {/* Label */}
      <div className="flex flex-1 flex-col">
        <span className={cn('text-sm font-bold', isDone ? 'text-emerald-800 line-through' : 'text-amber-900')}>
          {subject?.name ?? icon.label}
        </span>
        <span className={cn('text-xs', isDone ? 'text-emerald-600 line-through' : 'text-amber-700')}>
          {item.label}
        </span>
      </div>

      {/* Points badge / done label */}
      <span className={cn(
        'shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold transition-all',
        isDone
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      )}>
        {showPoints ? `+${item.points} ⭐` : isDone ? '✓ Xong!' : `+${item.points} ⭐`}
      </span>
    </button>
  )
}
