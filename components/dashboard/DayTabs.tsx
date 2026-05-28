'use client'

/** DayTabs — Mon–Fri selector for phone portrait schedule. */

import { DAY_LABELS, SCHOOL_DAYS } from '@/lib/constants'
import { dayShortLabel } from '@/lib/schedule-display'
import { cn } from '@/lib/utils'
import type { DayOfWeek } from '@/types'

interface DayTabsProps {
  activeDay: DayOfWeek
  todayDow: DayOfWeek | null
  onChange: (day: DayOfWeek) => void
  compact?: boolean
}

export const DayTabs = ({ activeDay, todayDow, onChange, compact = true }: DayTabsProps) => {
  return (
    <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-sm">
      {SCHOOL_DAYS.map((dow) => {
        const active = dow === activeDay
        const isToday = dow === todayDow
        return (
          <button
            key={dow}
            type="button"
            onClick={() => onChange(dow)}
            className={cn(
              'relative flex-1 rounded-xl border-0 font-black transition-colors',
              compact ? 'px-1 py-1.5 text-[11px]' : 'px-2 py-2.5 text-[13px]',
              active
                ? 'bg-schedule text-white shadow-[0_4px_10px_-3px_color-mix(in_oklab,var(--color-schedule)_50%,transparent)]'
                : isToday
                  ? 'text-schedule-deep'
                  : 'text-slate-600'
            )}
          >
            {compact ? dayShortLabel(dow) : DAY_LABELS[dow]}
            {isToday && !active ? (
              <span
                className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-schedule"
                aria-hidden="true"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
