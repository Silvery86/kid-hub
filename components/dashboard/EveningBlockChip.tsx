'use client'

/** EveningBlockChip — displays one recurring extra-class slot in the TodayPlanCard. */

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIcon } from '@/lib/icons'
import type { ClassPeriod } from '@/types'
import { getSubjectById } from '@/lib/data/subjects'

interface EveningBlockChipProps {
  period: ClassPeriod
  isCancelled: boolean
  onCancel?: (periodId: string) => void
  isParentMode?: boolean
}

export const EveningBlockChip = ({
  period,
  isCancelled,
  onCancel,
  isParentMode = false,
}: EveningBlockChipProps) => {
  const subject = period.subjectId ? getSubjectById(period.subjectId) : null
  const icon = getIcon(period.iconKey ?? period.subjectId)

  return (
    <div
      className={cn(
        'flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3 transition-opacity',
        'bg-violet-50 ring-1 ring-violet-200',
        isCancelled && 'opacity-50'
      )}
    >
      {/* Icon */}
      <span className="text-2xl" aria-hidden>
        {icon.emoji}
      </span>

      {/* Subject + time */}
      <div className="flex flex-1 flex-col">
        <span
          className={cn(
            'text-sm font-extrabold text-violet-900',
            isCancelled && 'line-through'
          )}
        >
          {subject?.name ?? icon.label}
        </span>
        <span className={cn('text-xs text-violet-600', isCancelled && 'line-through')}>
          {period.startTime} – {period.endTime}
        </span>
      </div>

      {/* Cancelled badge */}
      {isCancelled && (
        <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
          Đã huỷ
        </span>
      )}

      {/* Cancel button (parent mode only, non-cancelled) */}
      {isParentMode && !isCancelled && onCancel && period.id && (
        <button
          onClick={() => onCancel(period.id!)}
          aria-label="Huỷ buổi hôm nay"
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
