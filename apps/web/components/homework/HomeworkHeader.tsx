'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { dayShortLabel } from '@/lib/schedule-display'
import type { DayOfWeek } from '@/types'

export function HomeworkHeader({
  total,
  done,
  compact = false,
}: {
  total: number
  done: number
  compact?: boolean
}) {
  const [dayLabel, setDayLabel] = useState('')

  useEffect(() => {
    const day = new Date().getDay()
    const map: Record<number, DayOfWeek> = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
      0: 'sunday',
    }
    const dow = map[day]
    setDayLabel(dow ? dayShortLabel(dow) : '')
  }, [])

  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const ring = compact ? 48 : 60
  const r = compact ? 20 : 25
  const stroke = compact ? 5 : 6
  const circumference = 2 * Math.PI * r
  const dash = (circumference * pct) / 100

  return (
    <div
      className={cn(
        'flex flex-col rounded-card bg-white shadow-sm',
        compact ? 'gap-2 p-3' : 'gap-3 p-4 md:p-[18px]'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={cn('font-black text-text-primary', compact ? 'text-[13px]' : 'text-base')}>
            Bài tập hôm nay
          </div>
          <div className={cn('font-bold text-text-secondary', compact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-[13px]')}>
            {done}/{total} bài đã hoàn thành
            {dayLabel ? ` · ${dayLabel}` : ''}
          </div>
        </div>
        <div className="relative grid shrink-0 place-items-center" style={{ width: ring, height: ring }}>
          <svg width={ring} height={ring} className="absolute inset-0" aria-hidden="true">
            <circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              fill="none"
              stroke="var(--color-surface-muted)"
              strokeWidth={stroke}
            />
            <circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              fill="none"
              stroke="var(--color-progress-complete)"
              strokeWidth={stroke}
              strokeDasharray={`${dash} 999`}
              strokeLinecap="round"
              transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
            />
          </svg>
          <span className={cn('relative font-black text-text-primary', compact ? 'text-[11px]' : 'text-[13px]')}>
            {pct}%
          </span>
        </div>
      </div>
      <div className={cn('overflow-hidden rounded-full bg-surface-muted', compact ? 'h-1.5' : 'h-2')}>
        <div
          className="h-full rounded-full bg-progress-complete transition-[width] duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
