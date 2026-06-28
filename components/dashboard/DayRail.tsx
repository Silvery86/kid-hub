'use client'

/** DayRail — horizontal today period strip (tablet portrait). */

import { SubjectIcon } from '@/components/dashboard/SubjectIcon'
import { getSubjectById } from '@/lib/data/subjects'
import { schoolPeriodsOnly } from '@/lib/schedule-display'
import type { ClassPeriod } from '@/types'

interface DayRailProps {
  periods: ClassPeriod[]
  currentPeriodNumber: number | null
  progress?: number | null
  onPick?: (period: ClassPeriod) => void
}

export const DayRail = ({ periods, currentPeriodNumber, progress, onPick }: DayRailProps) => {
  const school = schoolPeriodsOnly(periods).sort(
    (a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0)
  )

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {school.map((period) => {
        const subject = getSubjectById(period.subjectId)
        const isNow = currentPeriodNumber != null && period.periodNumber === currentPeriodNumber
        const isDone =
          currentPeriodNumber != null &&
          period.periodNumber != null &&
          period.periodNumber < currentPeriodNumber
        const color = subject?.color ?? '#3b82f6'

        return (
          <button
            key={period.periodNumber ?? period.startTime}
            type="button"
            onClick={() => onPick?.(period)}
            className={`shrink-0 rounded-2xl border-2 bg-white p-3 text-left transition-transform active:scale-[0.98] ${
              isNow ? 'min-w-50' : 'min-w-35'
            } ${isDone ? 'opacity-55' : ''}`}
            style={{
              borderColor: isNow ? color : '#e2e8f0',
              boxShadow: isNow ? `0 8px 20px -12px ${color}` : undefined,
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-text-muted">
                Tiết {period.periodNumber}
              </span>
              {isDone ? <span className="text-sm text-emerald-500">✓</span> : null}
              {isNow ? (
                <span className="relative inline-flex size-2" aria-label="Đang học">
                  <span
                    className="animate-ping-ring absolute inline-flex size-full rounded-full opacity-75"
                    style={{ background: color }}
                  />
                  <span
                    className="relative inline-flex size-2 rounded-full"
                    style={{ background: color }}
                  />
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <SubjectIcon subjectId={period.subjectId} size={28} rounded={8} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-extrabold text-text-primary">
                  {subject?.name}
                </div>
                <div className="text-[11px] font-bold text-text-muted">{period.startTime}</div>
              </div>
            </div>
            {isNow && progress != null ? (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="animate-grow-width h-full rounded-full"
                  style={{ '--bar-pct': `${Math.round(progress * 100)}%`, background: color } as React.CSSProperties}
                />
              </div>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
