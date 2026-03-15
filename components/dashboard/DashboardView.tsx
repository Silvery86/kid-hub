'use client';

import { useState, useEffect } from 'react';
import { useSchedule } from '@/hooks/useSchedule';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUserProgress } from '@/hooks/useUserProgress';
import { WEEKLY_SCHEDULE } from '@/lib/data/schedule';
import { STORAGE_KEYS } from '@/lib/constants';
import { getSubjectById } from '@/lib/data/subjects';
import { CurrentClassHighlight } from '@/components/dashboard/CurrentClassHighlight';
import { TodayTimetable } from '@/components/dashboard/TodayTimetable';
import { StreakWidget } from '@/components/dashboard/StreakWidget';
import { BadgeModal } from '@/components/dashboard/BadgeModal';
import type { WeeklySchedule } from '@/types';

export const DashboardView = () => {
  const [storedSchedule] = useLocalStorage<WeeklySchedule>(
    STORAGE_KEYS.SCHEDULE,
    WEEKLY_SCHEDULE,
  );
  const { todaySchedule, currentPeriod, nextPeriod } = useSchedule(storedSchedule);
  const { updateStreak } = useUserProgress();
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  // Update streak once on mount
  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  const currentSubject = currentPeriod
    ? (getSubjectById(currentPeriod.subjectId) ?? null)
    : null;

  const nextSubject = nextPeriod ? getSubjectById(nextPeriod.subjectId) : null;

  return (
    <>
      <div className="flex h-screen p-6 gap-6 overflow-hidden">
        {/* ── Left column: greeting + current class + next up + streak ── */}
        <div className="flex flex-col gap-4 w-80 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-1">Chào Khôi! 👋</h1>
            <p className="text-slate-500 text-lg">Hôm nay học thật vui nhé.</p>
          </div>

          <CurrentClassHighlight period={currentPeriod} subject={currentSubject} />

          {nextPeriod && nextSubject && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tiếp theo
              </p>
              <p className="text-lg font-bold text-slate-700">{nextSubject.name}</p>
              <p className="text-sm text-slate-500">
                {nextPeriod.startTime} – {nextPeriod.endTime}
              </p>
            </div>
          )}

          {/* Streak + points */}
          <StreakWidget />

          {/* Badge button */}
          <button
            onClick={() => setIsBadgeModalOpen(true)}
            className="w-full rounded-2xl bg-white p-4 shadow-sm flex items-center gap-3 hover:bg-amber-50 transition-colors active:scale-[0.98]"
            aria-label="Xem huy hiệu"
          >
            <span className="text-3xl" aria-hidden="true">🏆</span>
            <div className="text-left">
              <p className="font-extrabold text-slate-700">Huy hiệu</p>
              <p className="text-sm text-slate-400">Xem bộ sưu tập</p>
            </div>
          </button>
        </div>

        {/* ── Right column: today's full timetable ── */}
        <div className="flex-1 overflow-y-auto">
          {todaySchedule ? (
            <TodayTimetable
              schedule={todaySchedule}
              currentPeriod={currentPeriod}
              nextPeriod={nextPeriod}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-8xl mb-5" aria-hidden="true">🎉</div>
                <h2 className="text-4xl font-extrabold text-slate-700">Hôm nay nghỉ học!</h2>
                <p className="text-slate-400 text-xl mt-2">Chúc Khôi ngày nghỉ vui vẻ.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BadgeModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} />
    </>
  );
};
