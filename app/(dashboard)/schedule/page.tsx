'use client'

import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useSchedule } from '@/hooks/useSchedule'
import { WEEKLY_SCHEDULE } from '@/lib/data/schedule'
import { STORAGE_KEYS, DAYS_OF_WEEK, DAY_LABELS } from '@/lib/constants'
import { getSubjectById } from '@/lib/data/subjects'
import { cn } from '@/lib/utils'
import type { WeeklySchedule } from '@/types'

const TOTAL_PERIODS = 5

export default function SchedulePage() {
  const [storedSchedule] = useLocalStorage<WeeklySchedule>(STORAGE_KEYS.SCHEDULE, WEEKLY_SCHEDULE)
  const { allDays, todayDow, currentPeriod } = useSchedule(storedSchedule)

  return (
    <TabletPageContainer className="overflow-hidden p-6">
      <h1 className="mb-5 text-3xl font-extrabold text-slate-800">Thời khóa biểu</h1>

      {/* 5-column weekly grid */}
      <div className="grid h-[calc(100vh-6.5rem)] grid-cols-5 gap-3">
        {DAYS_OF_WEEK.map((dow, colIndex) => {
          const daySchedule = allDays[colIndex] ?? { day: dow, periods: [] }
          const isToday = dow === todayDow

          return (
            <div
              key={dow}
              className={cn(
                'flex flex-col gap-2 rounded-3xl p-3',
                isToday ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-white/70'
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  'shrink-0 rounded-2xl px-3 py-2 text-center',
                  isToday ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                <p className="text-base font-extrabold">{DAY_LABELS[dow]}</p>
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
                      className="flex min-h-16 flex-1 items-center justify-center rounded-xl bg-slate-50"
                    >
                      <span className="text-sm font-bold text-slate-300">—</span>
                    </div>
                  )
                }

                return (
                  <div
                    key={periodNumber}
                    className={cn(
                      'flex min-h-16 flex-1 flex-col justify-between rounded-xl p-3',
                      'transition-[transform,box-shadow] duration-200',
                      subject.colorClass,
                      isActiveCell && 'scale-[1.03] shadow-lg ring-2 ring-white'
                    )}
                  >
                    {/* Live indicator for active cell */}
                    {isActiveCell && (
                      <span className="self-end" aria-label="Đang diễn ra">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                        </span>
                      </span>
                    )}
                    <p className="truncate text-sm leading-snug font-extrabold text-white">
                      {subject.name}
                    </p>
                    <p className="text-xs text-white/80">
                      {period.startTime} – {period.endTime}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </TabletPageContainer>
  )
}
