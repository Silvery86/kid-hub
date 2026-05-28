'use client'

/** DashboardView — main kid-facing hub composing schedule, games, streaks, and badge widgets. */

import { useMemo, useState, useEffect } from 'react'
import { useSchedule } from '@/hooks/useSchedule'
import { useUserProgress } from '@/hooks/useUserProgress'
import { getSubjectById } from '@/lib/data/subjects'
import { formatDayTimeRange, schoolPeriodsOnly } from '@/lib/schedule-display'
import { DayRail } from '@/components/dashboard/DayRail'
import { BadgeModal } from '@/components/dashboard/BadgeModal'
import { GameEntryCard } from '@/components/games/GameEntryCard'
import type { DailySchedule, WeeklySchedule, HomeworkItem } from '@/types'

interface DashboardViewProps {
  initialSchedule: DailySchedule[]
  initialHomework: HomeworkItem[]
}

export const DashboardView = ({ initialSchedule, initialHomework }: DashboardViewProps) => {
  const weeklySchedule: WeeklySchedule = { weekStartDate: '', days: initialSchedule }
  const {
    todaySchedule,
    currentPeriod,
    nextPeriod,
    periodProgress,
    minutesLeftInCurrentPeriod,
  } = useSchedule(weeklySchedule)
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
  const periods = todaySchedule?.periods ?? []
  const schoolPeriods = schoolPeriodsOnly(periods)
  const nowPeriodNumber = currentPeriod?.periodNumber ?? null
  const pendingHomeworkCount = useMemo(
    () => initialHomework.filter((item) => !item.isDone).length,
    [initialHomework]
  )

  return (
    <>
      <div className="flex h-dvh min-h-0 flex-col gap-3 overflow-y-auto p-3 portrait:pb-2 sm:gap-4 sm:p-4 lg:overflow-hidden lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary" suppressHydrationWarning>
              Chào Khôi!
            </h1>
            <p className="mt-1 text-sm font-semibold text-text-secondary portrait:text-base">
              Thứ Tư · {currentPeriod?.startTime ?? '09:15'} · Tuần 14
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800">
              <span aria-hidden="true">🪙</span>
              <span suppressHydrationWarning>{progress.totalPoints} điểm</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-orange-100 px-3 py-1.5 text-sm font-extrabold text-orange-800">
              <span aria-hidden="true">🔥</span>
              <span suppressHydrationWarning>{progress.currentStreak} ngày</span>
            </div>
            <button
              type="button"
              onClick={() => setIsBadgeModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-sm font-extrabold text-text-secondary shadow-sm transition-colors hover:bg-shell-light"
            >
              <span aria-hidden="true">🏆</span>
              <span suppressHydrationWarning>{progress.earnedBadges.length} huy hiệu</span>
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1.45fr_1fr] lg:grid-rows-[auto_auto_1fr] lg:gap-4">
          {/* Hero card */}
          <section
            className="relative overflow-hidden rounded-4xl p-5 text-white shadow-xl lg:col-span-2"
            style={{
              background: currentSubject ? `var(--color-${currentSubject.id})` : 'var(--color-btn-primary)',
            }}
          >
            {currentPeriod && currentSubject ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-white" />
                  <p className="text-xs font-extrabold tracking-[0.18em] uppercase text-white/85">
                    Đang học - Tiết {currentPeriod.periodNumber}
                  </p>
                </div>
                <h2 className="mt-2 text-5xl font-black leading-none tracking-tight portrait:text-4xl">
                  {currentSubject.name}
                </h2>
                <p className="mt-2 text-base font-bold text-white/90">
                  {currentPeriod.startTime} – {currentPeriod.endTime}
                  {minutesLeftInCurrentPeriod != null ? (
                    <span className="ml-2 text-white/85">· còn {minutesLeftInCurrentPeriod} phút</span>
                  ) : null}
                </p>
                {periodProgress != null ? (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${Math.round(periodProgress * 100)}%` }}
                    />
                  </div>
                ) : null}
                {nextPeriod && nextSubject ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2">
                    <p className="text-xs font-black tracking-[0.12em] uppercase text-white/80">Tiếp theo</p>
                    <p className="text-sm font-extrabold">{nextSubject.name}</p>
                    <p className="text-xs font-bold text-white/85">{nextPeriod.startTime}</p>
                  </div>
                ) : null}
                <span className="pointer-events-none absolute -right-4 -bottom-6 text-8xl opacity-20" aria-hidden="true">
                  {currentSubject.id === 'math' ? '🔢' : currentSubject.id === 'english' ? '🔤' : '📘'}
                </span>
              </>
            ) : (
              <>
                <div className="flex min-h-40 items-center justify-center gap-4 text-center">
                  <span className="text-6xl" aria-hidden="true">
                    🎉
                  </span>
                  <div>
                    <h2 className="text-3xl font-black">
                      {nextPeriod ? 'Đang nghỉ giữa giờ' : 'Học xong rồi!'}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-white/85">
                      {nextPeriod ? `${nextSubject?.name ?? 'Tiết tiếp theo'} bắt đầu lúc ${nextPeriod.startTime}` : 'Hẹn gặp lại ở buổi học tiếp theo.'}
                    </p>
                  </div>
                </div>
                {nextPeriod && nextSubject ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2">
                    <p className="text-xs font-black tracking-[0.12em] uppercase text-white/80">Tiếp theo</p>
                    <p className="text-sm font-extrabold">{nextSubject.name}</p>
                    <p className="text-xs font-bold text-white/85">{nextPeriod.startTime}</p>
                  </div>
                ) : null}
              </>
            )}
          </section>

          {/* Day rail — matches design DayRail (subject icon, progress, done check) */}
          <section className="rounded-card bg-white p-3 shadow-sm lg:col-span-2" data-testid="dashboard-day-rail">
            <div className="mb-3 flex items-baseline justify-between px-0.5">
              <h3 className="text-lg font-black text-text-primary">Hôm nay</h3>
              <span className="text-xs font-bold text-text-muted">
                {schoolPeriods.length > 0
                  ? `${schoolPeriods.length} tiết · ${formatDayTimeRange(periods)}`
                  : 'Không có tiết học'}
              </span>
            </div>
            {schoolPeriods.length > 0 ? (
              <DayRail
                periods={periods}
                currentPeriodNumber={nowPeriodNumber}
                progress={periodProgress}
              />
            ) : (
              <p className="py-4 text-center text-sm font-bold text-text-muted">Hôm nay không có lịch học.</p>
            )}
          </section>

          {/* Left-bottom column */}
          <section className="flex min-h-0 flex-col gap-4">
            <div className="rounded-card bg-white p-3 shadow-sm">
              <h3 className="mb-3 text-lg font-black text-text-primary">Trò chơi 🎮</h3>
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
            </div>
          </section>

          {/* Right-bottom column — homework only (no duplicate schedule list) */}
          <section className="flex min-h-0 flex-col">
            <div className="rounded-card bg-white p-3 shadow-sm lg:flex lg:h-full lg:flex-col">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-black text-text-primary">Bài tập</h3>
                <span className="rounded-pill bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                  {pendingHomeworkCount} chưa làm
                </span>
              </div>
              <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {initialHomework.length === 0 ? (
                  <p className="py-6 text-center text-sm font-bold text-text-muted">Hôm nay không có bài tập.</p>
                ) : (
                  initialHomework.map((hw) => {
                    const subject = getSubjectById(hw.subjectId)
                    return (
                      <div
                        key={hw.periodId}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${hw.isDone ? 'bg-slate-100' : 'bg-amber-50'}`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg">
                          {subject?.id === 'math' ? '🔢' : subject?.id === 'english' ? '🔤' : '📘'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-extrabold ${hw.isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}
                          >
                            {hw.homeworkNote}
                          </p>
                          <p className="text-[11px] font-bold text-text-muted">{subject?.name ?? hw.subjectId}</p>
                        </div>
                        <div
                          className={`h-5 w-5 shrink-0 rounded-full border-2 ${hw.isDone ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'}`}
                          aria-hidden="true"
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <BadgeModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} />
    </>
  )
}
