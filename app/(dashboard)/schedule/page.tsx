'use client';

import { TabletPageContainer } from '@/components/layout/TabletPageContainer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSchedule } from '@/hooks/useSchedule';
import { WEEKLY_SCHEDULE } from '@/lib/data/schedule';
import { STORAGE_KEYS, DAYS_OF_WEEK, DAY_LABELS } from '@/lib/constants';
import { getSubjectById } from '@/lib/data/subjects';
import { cn } from '@/lib/utils';
import type { WeeklySchedule } from '@/types';

const TOTAL_PERIODS = 5;

export default function SchedulePage() {
  const [storedSchedule] = useLocalStorage<WeeklySchedule>(
    STORAGE_KEYS.SCHEDULE,
    WEEKLY_SCHEDULE,
  );
  const { allDays, todayDow, currentPeriod } = useSchedule(storedSchedule);

  return (
    <TabletPageContainer className="p-6 overflow-hidden">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-5">Thời khóa biểu</h1>

      {/* 5-column weekly grid */}
      <div className="grid grid-cols-5 gap-3 h-[calc(100vh-6.5rem)]">
        {DAYS_OF_WEEK.map((dow, colIndex) => {
          const daySchedule = allDays[colIndex] ?? { day: dow, periods: [] };
          const isToday = dow === todayDow;

          return (
            <div
              key={dow}
              className={cn(
                'flex flex-col gap-2 rounded-3xl p-3',
                isToday ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-white/70',
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  'rounded-2xl px-3 py-2 text-center shrink-0',
                  isToday ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600',
                )}
              >
                <p className="font-extrabold text-base">{DAY_LABELS[dow]}</p>
              </div>

              {/* Period cells */}
              {Array.from({ length: TOTAL_PERIODS }, (_, i) => {
                const periodNumber = i + 1;
                const period = daySchedule.periods.find((p) => p.periodNumber === periodNumber);
                const subject = period ? getSubjectById(period.subjectId) : null;
                const isActiveCell = isToday && currentPeriod?.periodNumber === periodNumber;

                if (!period || !subject) {
                  return (
                    <div
                      key={periodNumber}
                      className="rounded-xl bg-slate-50 flex-1 flex items-center justify-center min-h-16"
                    >
                      <span className="text-slate-300 text-sm font-bold">—</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={periodNumber}
                    className={cn(
                      'rounded-xl p-3 flex flex-col justify-between flex-1 min-h-16',
                      'transition-[transform,box-shadow] duration-200',
                      subject.colorClass,
                      isActiveCell && 'ring-2 ring-white shadow-lg scale-[1.03]',
                    )}
                  >
                    {/* Live indicator for active cell */}
                    {isActiveCell && (
                      <span className="self-end" aria-label="Đang diễn ra">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                        </span>
                      </span>
                    )}
                    <p className="text-white font-extrabold text-sm leading-snug truncate">
                      {subject.name}
                    </p>
                    <p className="text-white/80 text-xs">
                      {period.startTime} – {period.endTime}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </TabletPageContainer>
  );
}
