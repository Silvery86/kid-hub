'use client'

/** PeriodCell — tappable schedule cell with subject tint (color-mix) or full color when live. */

import { getSubjectById } from '@/lib/data/subjects'
import type { ClassPeriod } from '@/types'

interface PeriodCellProps {
  period: ClassPeriod | undefined
  isNow: boolean
  compact?: boolean
  mini?: boolean
  onClick?: () => void
}

export const PeriodCell = ({ period, isNow, compact = false, mini = false, onClick }: PeriodCellProps) => {
  if (!period) {
    return (
      <div
        className="grid place-items-center border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300 font-extrabold"
        style={{
          borderRadius: compact ? 10 : 14,
          minHeight: compact ? 40 : 60,
          fontSize: compact ? 11 : 13,
        }}
      >
        —
      </div>
    )
  }

  const subject = getSubjectById(period.subjectId)
  if (!subject) {
    return (
      <div
        className="grid place-items-center rounded-xl bg-slate-50 text-xs font-bold text-slate-400"
        style={{ minHeight: compact ? 40 : 60 }}
      >
        —
      </div>
    )
  }

  const bg = isNow ? subject.color : `color-mix(in oklab, ${subject.color} 14%, white)`
  const fg = isNow ? '#fff' : subject.color
  const radius = compact ? 10 : 14

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${subject.name} · ${period.startTime}–${period.endTime}`}
      className="relative flex touch-manipulation flex-col items-start justify-between overflow-hidden text-left transition-transform active:scale-[0.98]"
      style={{
        background: bg,
        color: fg,
        border: isNow ? `2px solid ${subject.color}` : '2px solid transparent',
        borderRadius: radius,
        padding: compact ? '6px 8px' : '10px 12px',
        minHeight: compact ? 40 : 60,
        boxShadow: isNow ? `0 10px 24px -12px ${subject.color}` : undefined,
      }}
    >
      {mini ? (
        <div className="flex w-full items-center gap-1.5">
          <span className="text-sm leading-none">{subject.icon}</span>
          <span className="truncate text-[11px] font-black leading-tight">{subject.name}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <span className={compact ? 'text-sm' : 'text-base'} aria-hidden="true">
              {subject.icon}
            </span>
            <span className={cnText(compact)}>{subject.name}</span>
          </div>
          {!compact && (
            <span className="text-[11px] font-extrabold opacity-85">{period.startTime}</span>
          )}
        </>
      )}
      {isNow ? (
        <span
          className="absolute top-1.5 right-1.5 size-2 rounded-full bg-white"
          aria-label="Đang diễn ra"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        </span>
      ) : null}
    </button>
  )
}

function cnText(compact: boolean): string {
  return compact
    ? 'text-xs font-black leading-tight'
    : 'text-[13px] font-black leading-tight'
}
