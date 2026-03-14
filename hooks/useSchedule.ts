'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ClassPeriod, DailySchedule, DayOfWeek, WeeklySchedule } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';

// JS getDay() → 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const getDayOfWeek = (jsDay: number): DayOfWeek | null => {
  const map: Partial<Record<number, DayOfWeek>> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
  };
  return map[jsDay] ?? null;
};

const parseTimeToMinutes = (time: string): number => {
  const parts = time.split(':');
  return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10);
};

const getCurrentPeriod = (periods: ClassPeriod[], nowMinutes: number): ClassPeriod | null =>
  periods.find((p) => {
    const start = parseTimeToMinutes(p.startTime);
    const end = parseTimeToMinutes(p.endTime);
    return nowMinutes >= start && nowMinutes < end;
  }) ?? null;

const getNextPeriod = (periods: ClassPeriod[], nowMinutes: number): ClassPeriod | null =>
  periods.find((p) => parseTimeToMinutes(p.startTime) > nowMinutes) ?? null;

export interface UseScheduleResult {
  todaySchedule: DailySchedule | null;
  currentPeriod: ClassPeriod | null;
  nextPeriod: ClassPeriod | null;
  todayDow: DayOfWeek | null;
  allDays: DailySchedule[];
}

/**
 * Derives real-time schedule state from a WeeklySchedule.
 * Updates every 30 seconds so the active-class indicator stays current.
 */
export const useSchedule = (schedule: WeeklySchedule): UseScheduleResult => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(intervalId);
  }, []);

  return useMemo(() => {
    const todayDow = getDayOfWeek(now.getDay());
    const todaySchedule = todayDow
      ? (schedule.days.find((d) => d.day === todayDow) ?? null)
      : null;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const periods = todaySchedule?.periods ?? [];

    return {
      todaySchedule,
      currentPeriod: getCurrentPeriod(periods, nowMinutes),
      nextPeriod: getNextPeriod(periods, nowMinutes),
      todayDow,
      allDays: DAYS_OF_WEEK.map(
        (dow) => schedule.days.find((d) => d.day === dow) ?? { day: dow, periods: [] },
      ),
    };
  }, [now, schedule]);
};
