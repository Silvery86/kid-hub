'use client'

/** StreakWidget — displays the current streak count and total points earned. */

import { useUserProgress } from '@/hooks/useUserProgress'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Pulse } from '@/components/ui/Pulse'

export const StreakWidget = () => {
  const { progress } = useUserProgress()

  return (
    <div className="flex gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-2xl bg-amber-100 p-3">
        <span className="text-2xl" aria-hidden="true">
          🪙
        </span>
        <div>
          <p className="text-xs font-bold tracking-wide text-amber-600 uppercase">Điểm</p>
          <p className="text-2xl font-extrabold text-amber-700" suppressHydrationWarning>
            <AnimatedNumber value={progress.totalPoints} />
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center gap-3 rounded-2xl bg-orange-100 p-3">
        {/* A streak is the one number on this screen that is alive between
            visits — the flame says so without a word. */}
        <Pulse variant="float" active={progress.currentStreak > 0}>
          <span className="text-2xl" aria-hidden="true">
            🔥
          </span>
        </Pulse>
        <div>
          <p className="text-xs font-bold tracking-wide text-orange-600 uppercase">Chuỗi</p>
          <p className="text-2xl font-extrabold text-orange-700" suppressHydrationWarning>
            <AnimatedNumber value={progress.currentStreak} /> ngày
          </p>
        </div>
      </div>
    </div>
  )
}
