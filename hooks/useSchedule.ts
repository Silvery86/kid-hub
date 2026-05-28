'use client'

/** Schedule hook — derives today's and next period from a WeeklySchedule with live clock polling. */

import { useMemo, useState, useEffect } from 'react'
import type { ClassPeriod, DailySchedule, DayOfWeek, WeeklySchedule } from '@/types'
import { SCHOOL_DAYS } from '@/lib/constants'
import { getMinutesLeftInPeriod, getPeriodProgress } from '@/lib/schedule-display'

/** Maps a JS Date.getDay() value (0=Sun … 6=Sat) to DayOfWeek. */
const getDayOfWeek = (jsDay: number): DayOfWeek | null => {
  const map: Partial<Record<number, DayOfWeek>> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday',
  }
  return map[jsDay] ?? null
}

const parseTimeToMinutes = (time: string): number => {
  const parts = time.split(':')
  return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10)
}

const getCurrentPeriod = (periods: ClassPeriod[], nowMinutes: number): ClassPeriod | null =>
  periods.find((p) => {
    const start = parseTimeToMinutes(p.startTime)
    const end = parseTimeToMinutes(p.endTime)
    return nowMinutes >= start && nowMinutes < end
  }) ?? null

const getNextPeriod = (periods: ClassPeriod[], nowMinutes: number): ClassPeriod | null =>
  periods.find((p) => parseTimeToMinutes(p.startTime) > nowMinutes) ?? null

export interface UseScheduleResult {
  todaySchedule: DailySchedule | null
  currentPeriod: ClassPeriod | null
  nextPeriod: ClassPeriod | null
  todayDow: DayOfWeek | null
  /** School days only (Mon–Fri), aligned to SCHOOL_DAYS constant order. */
  allDays: DailySchedule[]
  now: Date | null
  periodProgress: number | null
  minutesLeftInCurrentPeriod: number | null
}

/**
 * Derives real-time schedule state from a WeeklySchedule (school periods only).
 * Polling pauses when the document tab is hidden to avoid waking a sleeping tablet.
 */
export const useSchedule = (schedule: WeeklySchedule): UseScheduleResult => {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const tick = () => {
      if (document.visibilityState === 'visible') setNow(new Date())
    }
    const intervalId = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  return useMemo(() => {
    if (!now) {
      return {
        todaySchedule: null,
        currentPeriod: null,
        nextPeriod: null,
        todayDow: null,
        allDays: SCHOOL_DAYS.map(
          (dow) => schedule.days.find((d) => d.day === dow) ?? { day: dow, periods: [] }
        ),
        now: null,
        periodProgress: null,
        minutesLeftInCurrentPeriod: null,
      }
    }

    const todayDow = getDayOfWeek(now.getDay())
    const todaySchedule = todayDow ? (schedule.days.find((d) => d.day === todayDow) ?? null) : null

    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const periods = todaySchedule?.periods ?? []

    const currentPeriod = getCurrentPeriod(periods, nowMinutes)

    return {
      todaySchedule,
      currentPeriod,
      nextPeriod: getNextPeriod(periods, nowMinutes),
      todayDow,
      allDays: SCHOOL_DAYS.map(
        (dow) => schedule.days.find((d) => d.day === dow) ?? { day: dow, periods: [] }
      ),
      now,
      periodProgress: currentPeriod ? getPeriodProgress(currentPeriod, now) : null,
      minutesLeftInCurrentPeriod: currentPeriod ? getMinutesLeftInPeriod(currentPeriod, now) : null,
    }
  }, [now, schedule])
}
