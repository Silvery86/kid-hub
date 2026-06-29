'use client'

/** DayList — vertical period rows for phone portrait schedule. */

import { SubjectIcon } from '@/components/dashboard/SubjectIcon'
import { getSubjectById } from '@/lib/data/subjects'
import { schoolPeriodsOnly } from '@/lib/schedule-display'
import type { ClassPeriod } from '@/types'

interface DayListProps {
  periods: ClassPeriod[]
  currentPeriodNumber: number | null
  onPick?: (period: ClassPeriod) => void
}

export const DayList = ({ periods, currentPeriodNumber, onPick }: DayListProps) => {
  const school = schoolPeriodsOnly(periods).sort(
    (a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0)
  )

  return (
    <div className="flex flex-col gap-2">
      {school.map((period) => {
        const subject = getSubjectById(period.subjectId)
        const isNow = currentPeriodNumber != null && period.periodNumber === currentPeriodNumber
        const color = subject?.color ?? '#94a3b8'

        return (
          <button
            key={period.periodNumber ?? period.startTime}
            type="button"
            onClick={() => onPick?.(period)}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left transition-transform active:scale-[0.99]"
            style={{
              border: isNow ? `2px solid ${color}` : '2px solid transparent',
              boxShadow: isNow
                ? `0 8px 22px -10px ${color}`
                : '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            <div
              className="grid size-8 shrink-0 place-items-center rounded-[10px] text-[13px] font-black"
              style={{
                background: isNow ? color : '#f1f5f9',
                color: isNow ? '#fff' : '#64748b',
              }}
            >
              {period.periodNumber}
            </div>
            <SubjectIcon subjectId={period.subjectId} size={40} rounded={11} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-text-primary">{subject?.name ?? '—'}</div>
              <div className="text-xs font-bold text-text-secondary">
                {period.startTime} – {period.endTime}
              </div>
            </div>
            {isNow ? (
              <span className="shrink-0 rounded-full bg-schedule-soft px-2.5 py-1 text-[11px] font-extrabold text-schedule-deep">
                Đang học
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
