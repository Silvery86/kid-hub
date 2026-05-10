'use client'

/**
 * ScheduleGrid — client component rendering the 5-day weekly timetable grid with
 * live-class highlighting driven by the wall-clock time (updates every 30 s).
 */

import { useSchedule } from '@/hooks/useSchedule'
import { DAYS_OF_WEEK, DAY_LABELS } from '@/lib/constants'
import { getSubjectById } from '@/lib/data/subjects'
import { cn } from '@/lib/utils'
import type { DailySchedule, WeeklySchedule } from '@/types'

const TOTAL_PERIODS = 5

interface ScheduleGridProps {
  initialSchedule: DailySchedule[]
}

/**
 * Renders the full weekly schedule grid, highlighting the current active period
 * using real-time clock data derived from useSchedule.
 */
export const ScheduleGrid = ({ initialSchedule }: ScheduleGridProps) => {
  const weeklySchedule: WeeklySchedule = { weekStartDate: '', days: initialSchedule }
  const { allDays, todayDow, currentPeriod } = useSchedule(weeklySchedule)

  return (
    <div className="grid h-[calc(100dvh-6.5rem)] grid-cols-5 gap-3 portrait:gap-1">
      {DAYS_OF_WEEK.map((dow, colIndex) => {
        const daySchedule = allDays[colIndex] ?? { day: dow, periods: [] }
        const isToday = dow === todayDow

        return (
          <div
            key={dow}
            className={cn(
              'flex flex-col gap-2 rounded-3xl p-3 portrait:gap-1 portrait:rounded-xl portrait:p-1.5',
              isToday ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-white/70'
            )}
          >
            {/* Day header */}
            <div
              className={cn(
                'shrink-0 rounded-2xl px-3 py-2 text-center portrait:rounded-lg portrait:px-1 portrait:py-1',
                isToday ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              <p className="text-base font-extrabold portrait:text-[0.6rem] portrait:leading-tight">{DAY_LABELS[dow]}</p>
            </div>

            {/* Period cells */}
            {Array.from({ length: TOTAL_PERIODS }, (_, i) => {
              const periodNumber = i + 1
              const period = daySchedule.periods.find((p) => p.periodNumber === periodNumber)
              const subject = period ? getSubjectById(period.subjectId) : null
              const isActiveCell = isToday && currentPeriod?.periodNumber === periodNumber

              if (!period || !subject) {
                return (
                  <div
                    key={periodNumber}
                    className="flex min-h-16 flex-1 items-center justify-center rounded-xl bg-slate-50 portrait:min-h-10 portrait:rounded-lg"
                  >
                    <span className="text-sm font-bold text-slate-300">—</span>
                  </div>
                )
              }

              return (
                <div
                  key={periodNumber}
                  className={cn(
                    'flex min-h-16 flex-1 flex-col justify-between rounded-xl p-3 portrait:min-h-10 portrait:rounded-lg portrait:p-1.5',
                    'transition-[transform,box-shadow] duration-200',
                    subject.colorClass,
                    isActiveCell && 'scale-[1.03] shadow-lg ring-2 ring-white'
                  )}
                >
                  {isActiveCell && (
                    <span className="self-end" aria-label="Đang diễn ra">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                      </span>
                    </span>
                  )}
                  <p className="text-sm leading-snug font-extrabold text-white portrait:text-[0.6rem] portrait:leading-tight">
                    {subject.name}
                  </p>
                  {/* Hide time in portrait — too narrow to show */}
                  <p className="text-xs text-white/80 portrait:hidden">
                    {period.startTime} – {period.endTime}
                  </p>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
