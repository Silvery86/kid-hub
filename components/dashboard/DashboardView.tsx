'use client'

/** DashboardView — main kid-facing hub composing schedule, games, streaks, and badge widgets. */

import { useState, useEffect } from 'react'
import { useSchedule } from '@/hooks/useSchedule'
import { useUserProgress } from '@/hooks/useUserProgress'
import { getSubjectById } from '@/lib/data/subjects'
import { CurrentClassHighlight } from '@/components/dashboard/CurrentClassHighlight'
import { TodayTimetable } from '@/components/dashboard/TodayTimetable'
import { StreakWidget } from '@/components/dashboard/StreakWidget'
import { BadgeModal } from '@/components/dashboard/BadgeModal'
import { GameEntryCard } from '@/components/games/GameEntryCard'
import { HomeworkChip } from '@/components/homework/HomeworkChip'
import type { DailySchedule, WeeklySchedule, HomeworkItem } from '@/types'

interface DashboardViewProps {
  initialSchedule: DailySchedule[]
  initialHomework: HomeworkItem[]
}

export const DashboardView = ({ initialSchedule, initialHomework }: DashboardViewProps) => {
  const weeklySchedule: WeeklySchedule = { weekStartDate: '', days: initialSchedule }
  const { todaySchedule, currentPeriod, nextPeriod } = useSchedule(weeklySchedule)
  const { updateStreak, progress } = useUserProgress()
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Update streak once on mount; also mark mounted to hydrate localStorage-dependent values
  useEffect(() => {
    setMounted(true)
    updateStreak()
  }, [updateStreak])

  const currentSubject = currentPeriod ? (getSubjectById(currentPeriod.subjectId) ?? null) : null

  const nextSubject = nextPeriod ? getSubjectById(nextPeriod.subjectId) : null

  return (
    <>
      <div
        className="flex min-h-0 h-dvh max-h-dvh flex-row gap-4 overflow-hidden p-4 portrait:flex-col portrait:overflow-y-auto portrait:pb-2 sm:gap-6 sm:p-6"
      >
        {/* ── Primary column (landscape: left / portrait: top): greeting + widgets ── */}
        <div className="flex w-80 min-h-0 min-w-0 shrink-0 flex-col gap-4 portrait:w-full">
          <div>
            <h1 className="mb-1 text-3xl font-extrabold text-text-primary">Chào Khôi! 👋</h1>
            <p className="text-lg text-text-secondary">Hôm nay học thật vui nhé.</p>
          </div>

          <CurrentClassHighlight period={currentPeriod} subject={currentSubject} />

          {nextPeriod && nextSubject && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-1 text-xs font-bold tracking-wider text-text-secondary uppercase">
                Tiếp theo
              </p>
              <p className="text-lg font-bold text-text-primary">{nextSubject.name}</p>
              <p className="text-sm text-text-secondary">
                {nextPeriod.startTime} – {nextPeriod.endTime}
              </p>
            </div>
          )}

          {/* Homework entry point — only visible when pending items exist */}
          <HomeworkChip items={initialHomework} />

          {/* Streak + points */}
          <StreakWidget />

          {/* Badge button */}
          <button
            type="button"
            onClick={() => setIsBadgeModalOpen(true)}
            style={{ minHeight: '4rem' }}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-shell-light active:scale-[0.98]"
            aria-label="Xem huy hiệu"
          >
            <span className="text-3xl" aria-hidden="true">
              🏆
            </span>
            <div className="text-left">
              <p className="font-extrabold text-text-primary">Huy hiệu</p>
              <p className="text-sm text-text-secondary">Xem bộ sưu tập</p>
            </div>
          </button>
        </div>

        {/* ── Secondary column: game cards + today's timetable ── */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 portrait:overflow-visible landscape:overflow-y-auto">
          {/* Game entry cards */}
          <section aria-label="Trò chơi">
            <h2 className="mb-3 px-1 text-xl font-extrabold text-text-primary">Trò chơi 🎮</h2>
            <div className="grid grid-cols-2 gap-3">
              <GameEntryCard
                gameType="math"
                title="Number Ninja"
                description="Toán cộng và trừ"
                emoji="🔢"
                href="/math"
                colorClass="bg-math"
                bestScore={mounted ? (progress.bestScores.find((b) => b.gameType === 'math') ?? null) : null}
              />
              <GameEntryCard
                gameType="english"
                title="Word Explorer"
                description="Tiếng Anh vui"
                emoji="🔤"
                href="/english"
                colorClass="bg-english"
                bestScore={mounted ? (progress.bestScores.find((b) => b.gameType === 'english') ?? null) : null}
              />
            </div>
          </section>

          {/* Today's timetable */}
          {todaySchedule ? (
            <TodayTimetable
              schedule={todaySchedule}
              currentPeriod={currentPeriod}
              nextPeriod={nextPeriod}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mb-5 text-8xl" aria-hidden="true">
                  🎉
                </div>
                <h2 className="text-4xl font-extrabold text-text-primary">Hôm nay nghỉ học!</h2>
                <p className="mt-2 text-xl text-text-secondary">Chúc Khôi ngày nghỉ vui vẻ.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BadgeModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} />
    </>
  )
}
