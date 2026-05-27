'use client'

/** WeekGrid — Mon–Fri timetable with rows-periods or cols-periods orientation. */

import { PeriodCell } from '@/components/dashboard/PeriodCell'
import { DAY_LABELS, SCHOOL_DAYS } from '@/lib/constants'
import {
  dayShortLabel,
  getMaxPeriodNumber,
  getPeriodForCell,
  getPeriodSlotLabels,
  schoolDaysFromSchedule,
} from '@/lib/schedule-display'
import type { ClassPeriod, DailySchedule, DayOfWeek } from '@/types'

export type WeekGridOrient = 'rows-periods' | 'cols-periods'

interface WeekGridProps {
  days: DailySchedule[]
  orient: WeekGridOrient
  todayDow: DayOfWeek | null
  currentPeriodNumber: number | null
  onPick?: (payload: { day: DayOfWeek; period: ClassPeriod }) => void
  compact?: boolean
  mini?: boolean
  className?: string
}

export const WeekGrid = ({
  days,
  orient,
  todayDow,
  currentPeriodNumber,
  onPick,
  compact = false,
  mini = false,
  className = '',
}: WeekGridProps) => {
  const schoolDays = schoolDaysFromSchedule(days)
  const slotLabels = getPeriodSlotLabels(schoolDays)
  const maxPeriods = getMaxPeriodNumber(schoolDays)

  if (orient === 'rows-periods') {
    return (
      <div
        className={`grid gap-1.5 sm:gap-2 ${className}`}
        style={{
          gridTemplateColumns: `minmax(48px, 64px) repeat(${SCHOOL_DAYS.length}, minmax(0, 1fr))`,
        }}
      >
        <div />
        {SCHOOL_DAYS.map((dow) => {
          const isToday = dow === todayDow
          return (
            <div
              key={dow}
              className="rounded-xl px-1 py-2 text-center text-xs font-black"
              style={{
                color: isToday ? 'var(--color-schedule-deep)' : '#64748b',
                background: isToday ? 'var(--color-schedule-soft)' : '#f8fafc',
              }}
            >
              <div className="hidden sm:block">{DAY_LABELS[dow]}</div>
              <div className="sm:hidden">{dayShortLabel(dow)}</div>
              {isToday ? <div className="mt-0.5 text-[10px] font-extrabold text-schedule">Hôm nay</div> : null}
            </div>
          )
        })}
        {Array.from({ length: maxPeriods }, (_, i) => {
          const periodNumber = i + 1
          const slot = slotLabels.find((s) => s.periodNumber === periodNumber)
          return (
            <div key={periodNumber} className="contents">
              <div className="flex flex-col items-end justify-center pr-1.5 text-right">
                <div className="text-sm font-extrabold text-text-primary">{periodNumber}</div>
                {slot?.startTime ? (
                  <div className="text-[11px] font-extrabold text-text-muted">{slot.startTime}</div>
                ) : null}
              </div>
              {SCHOOL_DAYS.map((dow) => {
                const daySchedule = schoolDays.find((d) => d.day === dow)
                const period = getPeriodForCell(daySchedule, periodNumber)
                const isNow =
                  dow === todayDow && currentPeriodNumber != null && periodNumber === currentPeriodNumber
                return (
                  <PeriodCell
                    key={dow}
                    period={period}
                    isNow={isNow}
                    compact={compact}
                    mini={mini}
                    onClick={
                      period && onPick
                        ? () => onPick({ day: dow, period })
                        : undefined
                    }
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={`grid gap-1.5 sm:gap-2 ${className}`}
      style={{
        gridTemplateColumns: `minmax(88px, 100px) repeat(${maxPeriods}, minmax(0, 1fr))`,
      }}
    >
      <div />
      {slotLabels.map((slot) => (
        <div
          key={slot.periodNumber}
          className="rounded-[10px] bg-slate-50 px-1 py-1.5 text-center"
        >
          <div className="text-[13px] font-black text-text-primary">Tiết {slot.periodNumber}</div>
          {slot.startTime && slot.endTime ? (
            <div className="text-[11px] font-extrabold text-text-secondary">
              {slot.startTime}–{slot.endTime}
            </div>
          ) : null}
        </div>
      ))}
      {SCHOOL_DAYS.map((dow) => {
        const daySchedule = schoolDays.find((d) => d.day === dow)
        const isToday = dow === todayDow
        return (
          <div key={dow} className="contents">
            <div
              className="flex items-center gap-2 rounded-xl px-2 text-[13px] font-black"
              style={{
                color: isToday ? 'var(--color-schedule-deep)' : '#1e293b',
                background: isToday ? 'var(--color-schedule-soft)' : 'transparent',
              }}
            >
              <span>{DAY_LABELS[dow]}</span>
              {isToday ? (
                <span className="text-[10px] font-extrabold text-schedule">● hôm nay</span>
              ) : null}
            </div>
            {Array.from({ length: maxPeriods }, (_, i) => {
              const periodNumber = i + 1
              const period = getPeriodForCell(daySchedule, periodNumber)
              const isNow =
                dow === todayDow &&
                currentPeriodNumber != null &&
                periodNumber === currentPeriodNumber
              return (
                <PeriodCell
                  key={periodNumber}
                  period={period}
                  isNow={isNow}
                  compact={compact}
                  mini={mini}
                  onClick={
                    period && onPick ? () => onPick({ day: dow, period }) : undefined
                  }
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
