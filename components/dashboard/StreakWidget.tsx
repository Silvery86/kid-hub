'use client';

import { useUserProgress } from '@/hooks/useUserProgress';

export const StreakWidget = () => {
  const { progress } = useUserProgress();

  return (
    <div className="flex gap-3">
      <div className="flex-1 rounded-2xl bg-amber-100 p-3 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🪙</span>
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Điểm</p>
          <p className="text-2xl font-extrabold text-amber-700">{progress.totalPoints}</p>
        </div>
      </div>
      <div className="flex-1 rounded-2xl bg-orange-100 p-3 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🔥</span>
        <div>
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Chuỗi</p>
          <p className="text-2xl font-extrabold text-orange-700">
            {progress.currentStreak} ngày
          </p>
        </div>
      </div>
    </div>
  );
};
