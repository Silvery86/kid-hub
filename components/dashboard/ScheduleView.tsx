'use client'

/** ScheduleView — orientation-aware school timetable (design: schedule.jsx). */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DayList } from '@/components/dashboard/DayList'
import { DayRail } from '@/components/dashboard/DayRail'
import { DayTabs } from '@/components/dashboard/DayTabs'
import { SubjectLegend } from '@/components/dashboard/SubjectLegend'
import { WeekGrid } from '@/components/dashboard/WeekGrid'
import { useSchedule } from '@/hooks/useSchedule'
import { DAY_LABELS } from '@/lib/constants'
import { getSubjectById } from '@/lib/data/subjects'
import {
  computeWeekStats,
  formatDayTimeRange,
  formatPeriodDuration,
  formatWeekSubtitleForOffset,
  getIsoWeekNumber,
  getMondayForWeekOffset,
  schoolDaysFromSchedule,
  schoolPeriodsOnly,
} from '@/lib/schedule-display'
import type { ClassPeriod, DailySchedule, DayOfWeek } from '@/types'

interface ScheduleViewProps {
  initialSchedule: DailySchedule[]
}

const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':')
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)
}

const periodProgress = (period: ClassPeriod, now: Date): number | null => {
  const start = parseTimeToMinutes(period.startTime)
  const end = parseTimeToMinutes(period.endTime)
  const nowM = now.getHours() * 60 + now.getMinutes()
  if (nowM < start || nowM >= end) return null
  return (nowM - start) / (end - start)
}

interface SelectedCell {
  day: DayOfWeek
  period: ClassPeriod
}

export const ScheduleView = ({ initialSchedule }: ScheduleViewProps) => {
  const weeklySchedule = useMemo(() => ({ weekStartDate: '', days: initialSchedule }), [initialSchedule])
  const { allDays, todayDow, currentPeriod, todaySchedule } = useSchedule(weeklySchedule)
  const schoolDays = useMemo(() => schoolDaysFromSchedule(allDays), [allDays])
  const stats = useMemo(() => computeWeekStats(schoolDays), [schoolDays])

  const defaultDay = todayDow ?? 'monday'
  const [activeDay, setActiveDay] = useState<DayOfWeek>(defaultDay)
  const [selected, setSelected] = useState<SelectedCell | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)

  const isCurrentWeek = weekOffset === 0
  const displayTodayDow = isCurrentWeek ? todayDow : null
  const currentPeriodNumber = isCurrentWeek ? (currentPeriod?.periodNumber ?? null) : null
  const weekSubtitle = formatWeekSubtitleForOffset(weekOffset)
  const weekNumber = getIsoWeekNumber(getMondayForWeekOffset(weekOffset))
  const weekNavLabel = isCurrentWeek ? 'Tuần này' : `Tuần ${weekNumber}`

  const activeDaySchedule = schoolDays.find((d) => d.day === activeDay)
  const activePeriods = activeDaySchedule?.periods ?? []
  const todayPeriods = todaySchedule?.periods ?? []

  const selectedCell: SelectedCell | null =
    selected ??
    (isCurrentWeek && todayDow && currentPeriod
      ? { day: todayDow, period: currentPeriod }
      : isCurrentWeek && todayDow && todayPeriods.length > 0
        ? {
            day: todayDow,
            period:
              schoolPeriodsOnly(todayPeriods).find((p) => p.periodNumber === 3) ??
              schoolPeriodsOnly(todayPeriods)[0]!,
          }
        : null)

  const handlePick = (payload: { day: DayOfWeek; period: ClassPeriod }) => {
    setSelected(payload)
  }

  const selectedSubject = selectedCell ? getSubjectById(selectedCell.period.subjectId) : null
  const selectedDayLabel = selectedCell ? DAY_LABELS[selectedCell.day] : ''

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-shell-kid portrait:overflow-y-auto">
      {/* ── Phone portrait ─────────────────────────────────────────── */}
      <div className="hidden h-full min-h-0 flex-col gap-3 px-3.5 pb-4 pt-3.5 portrait:max-md:flex">
        <ScheduleHeader
          weekSubtitle={weekSubtitle}
          weekNavLabel={weekNavLabel}
          compact
          onPrevWeek={() => setWeekOffset((o) => o - 1)}
          onNextWeek={() => setWeekOffset((o) => o + 1)}
          onThisWeek={() => setWeekOffset(0)}
        />
        <DayTabs activeDay={activeDay} todayDow={displayTodayDow} onChange={setActiveDay} compact />
        <DaySummaryCard
          dayLabel={DAY_LABELS[activeDay]}
          periodCount={schoolPeriodsOnly(activePeriods).length}
          timeRange={formatDayTimeRange(activePeriods)}
          isToday={activeDay === displayTodayDow}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DayList
            periods={activePeriods}
            currentPeriodNumber={activeDay === displayTodayDow ? currentPeriodNumber : null}
            onPick={(p) => handlePick({ day: activeDay, period: p })}
          />
        </div>
      </div>

      {/* ── Tablet portrait ────────────────────────────────────────── */}
      <div className="hidden min-h-0 flex-col gap-4 overflow-hidden p-5 md:portrait:flex portrait:max-md:hidden">
        <ScheduleHeader
          weekSubtitle={weekSubtitle}
          weekNavLabel={weekNavLabel}
          showWeekNav
          onPrevWeek={() => setWeekOffset((o) => o - 1)}
          onNextWeek={() => setWeekOffset((o) => o + 1)}
          onThisWeek={() => setWeekOffset(0)}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          <WeekGrid
            days={schoolDays}
            orient="rows-periods"
            todayDow={displayTodayDow}
            currentPeriodNumber={currentPeriodNumber}
            onPick={handlePick}
          />
        </div>
        {isCurrentWeek && todayDow && todayPeriods.length > 0 ? (
          <div className="shrink-0 rounded-[22px] bg-white p-4 shadow-sm">
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-[15px] font-black text-text-primary">
                Hôm nay — {DAY_LABELS[todayDow]}
              </span>
              <span className="text-xs font-extrabold text-text-muted">
                {schoolPeriodsOnly(todayPeriods).length} tiết · {formatDayTimeRange(todayPeriods)}
              </span>
            </div>
            <DayRail
              periods={todayPeriods}
              currentPeriodNumber={currentPeriodNumber}
              progress={
                currentPeriod ? periodProgress(currentPeriod, new Date()) : null
              }
              onPick={(p) => todayDow && handlePick({ day: todayDow, period: p })}
            />
          </div>
        ) : null}
      </div>

      {/* ── Landscape (phone L / tablet L / desktop) ───────────────── */}
      <div className="portrait:hidden flex min-h-0 flex-1 gap-4 p-4 lg:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <ScheduleHeader
            weekSubtitle={weekSubtitle}
            weekNavLabel={weekNavLabel}
            showWeekNav
            showWeekPill
            totalPeriods={stats.totalPeriods}
            onPrevWeek={() => setWeekOffset((o) => o - 1)}
            onNextWeek={() => setWeekOffset((o) => o + 1)}
            onThisWeek={() => setWeekOffset(0)}
          />

          <div className="min-h-0 flex-1 overflow-auto md:landscape:hidden">
            <WeekGrid
              days={schoolDays}
              orient="rows-periods"
              todayDow={displayTodayDow}
              currentPeriodNumber={currentPeriodNumber}
              onPick={handlePick}
              compact
              mini
            />
          </div>

          <div className="hidden min-h-0 flex-1 overflow-auto md:landscape:block">
            <WeekGrid
              days={schoolDays}
              orient="cols-periods"
              todayDow={displayTodayDow}
              currentPeriodNumber={currentPeriodNumber}
              onPick={handlePick}
            />
          </div>
        </div>

        <aside className="hidden w-[280px] shrink-0 flex-col gap-3 overflow-y-auto md:landscape:flex lg:w-[320px]">
          {isCurrentWeek && todayDow && todayPeriods.length > 0 ? (
            <div className="lg:hidden">
              <TodayAccentCard
                dayLabel={DAY_LABELS[todayDow]}
                periods={todayPeriods}
                currentPeriodNumber={currentPeriodNumber}
              />
            </div>
          ) : null}

          <div className="rounded-[22px] bg-white p-4 shadow-sm">
            <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              Phân bổ môn học
            </p>
            <SubjectLegend days={schoolDays} />
          </div>

          <div className="hidden flex-col gap-3 lg:flex">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              Chi tiết tiết học
            </p>
            {selectedCell && selectedSubject ? (
              <PeriodDetailCard
                dayLabel={selectedDayLabel}
                period={selectedCell.period}
                subjectName={selectedSubject.name}
                subjectColor={selectedSubject.color}
                subjectIcon={selectedSubject.icon}
              />
            ) : null}

            <div className="rounded-[22px] bg-white p-4 shadow-sm">
              <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                Tổng kết tuần
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[14px] bg-slate-50 p-3">
                  <div className="text-2xl font-black text-text-primary">{stats.totalPeriods}</div>
                  <div className="text-[11px] font-bold text-text-secondary">Tổng tiết học</div>
                </div>
                <div className="rounded-[14px] bg-slate-50 p-3">
                  <div className="text-2xl font-black text-text-primary">{stats.uniqueSubjects}</div>
                  <div className="text-[11px] font-bold text-text-secondary">Môn khác nhau</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ScheduleHeader({
  weekSubtitle,
  weekNavLabel = 'Tuần này',
  compact = false,
  showWeekNav = false,
  showWeekPill = false,
  totalPeriods,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
}: {
  weekSubtitle: string
  weekNavLabel?: string
  compact?: boolean
  showWeekNav?: boolean
  showWeekPill?: boolean
  totalPeriods?: number
  onPrevWeek?: () => void
  onNextWeek?: () => void
  onThisWeek?: () => void
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <div>
        <h1
          className={
            compact
              ? 'text-[22px] font-black tracking-tight text-text-primary'
              : 'text-[30px] font-black tracking-tight text-text-primary lg:text-[32px]'
          }
        >
          Lịch học
        </h1>
        <p className="mt-0.5 text-xs font-bold text-text-secondary lg:text-sm">{weekSubtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showWeekPill && totalPeriods != null ? (
          <span className="hidden rounded-full bg-schedule-soft px-3 py-1.5 text-xs font-extrabold text-schedule-deep sm:inline">
            {totalPeriods} tiết / tuần
          </span>
        ) : null}
        {showWeekNav && onPrevWeek && onNextWeek && onThisWeek ? (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={onPrevWeek}
              className="rounded-full border-2 border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-text-primary transition-colors hover:bg-slate-50"
              aria-label="Tuần trước"
            >
              ← Tuần trước
            </button>
            <button
              type="button"
              onClick={onThisWeek}
              className="rounded-full bg-schedule-soft px-3.5 py-2 text-sm font-black text-schedule-deep transition-colors hover:bg-schedule/10"
              aria-label="Về tuần này"
            >
              {weekNavLabel}
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="rounded-full border-2 border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-text-primary transition-colors hover:bg-slate-50"
              aria-label="Tuần sau"
            >
              Tuần sau →
            </button>
          </div>
        ) : null}
        <Link
          href="/parent"
          className={
            compact
              ? 'grid size-10 place-items-center rounded-xl bg-white text-lg shadow-sm'
              : 'rounded-full bg-schedule px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_-10px_var(--color-schedule)]'
          }
          title="Sửa lịch (Bố mẹ)"
        >
          {compact ? '✏️' : '✏️ Sửa lịch'}
        </Link>
      </div>
    </div>
  )
}

function DaySummaryCard({
  dayLabel,
  periodCount,
  timeRange,
  isToday,
}: {
  dayLabel: string
  periodCount: number
  timeRange: string
  isToday: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-white p-3.5 shadow-sm">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-schedule-soft text-[22px] font-black text-schedule-deep">
        {periodCount}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-black text-text-primary">{dayLabel}</div>
        <div className="text-xs font-bold text-text-secondary">
          {periodCount} tiết · {timeRange}
        </div>
      </div>
      {isToday ? (
        <span className="shrink-0 rounded-full bg-schedule px-2.5 py-1 text-[11px] font-extrabold text-white">
          Hôm nay
        </span>
      ) : null}
    </div>
  )
}

function TodayAccentCard({
  dayLabel,
  periods,
  currentPeriodNumber,
}: {
  dayLabel: string
  periods: ClassPeriod[]
  currentPeriodNumber: number | null
}) {
  const school = schoolPeriodsOnly(periods).sort(
    (a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0)
  )

  return (
    <div
      className="rounded-[22px] p-4 text-white shadow-[0_16px_32px_-16px_var(--color-schedule)]"
      style={{ background: 'var(--color-schedule)' }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-85">Hôm nay</p>
      <p className="mt-0.5 text-[26px] font-black leading-tight">{dayLabel}</p>
      <p className="mt-1 text-xs font-bold opacity-85">
        {school.length} tiết · {formatDayTimeRange(periods)}
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {school.map((p) => {
          const subject = getSubjectById(p.subjectId)
          const isNow = currentPeriodNumber != null && p.periodNumber === currentPeriodNumber
          return (
            <div
              key={p.periodNumber}
              className="flex items-center gap-2 rounded-[10px] px-2 py-1.5"
              style={{
                background: isNow ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="grid size-[22px] shrink-0 place-items-center rounded-[7px] text-[11px] font-black"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {p.periodNumber}
              </div>
              <span className="min-w-0 flex-1 truncate text-xs font-extrabold">{subject?.name}</span>
              <span className="text-[11px] font-extrabold opacity-85">{p.startTime}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PeriodDetailCard({
  dayLabel,
  period,
  subjectName,
  subjectColor,
  subjectIcon,
}: {
  dayLabel: string
  period: ClassPeriod
  subjectName: string
  subjectColor: string
  subjectIcon: string
}) {
  const duration = formatPeriodDuration(period.startTime, period.endTime)
  const showGame = period.subjectId === 'math' || period.subjectId === 'english'
  const gameHref = period.subjectId === 'math' ? '/math' : '/english'

  return (
    <div className="relative overflow-hidden rounded-[22px] p-5 text-white" style={{ background: subjectColor, boxShadow: `0 18px 36px -18px ${subjectColor}` }}>
      <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-85">
        {dayLabel} · Tiết {period.periodNumber}
      </p>
      <p className="mt-1 text-[32px] font-black leading-tight tracking-tight">{subjectName}</p>
      <p className="mt-1 text-sm font-bold opacity-90">
        {period.startTime} – {period.endTime} · {duration} phút
      </p>
      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-white px-4 py-2.5 text-[13px] font-extrabold"
          style={{ color: subjectColor }}
        >
          Mở bài học
        </button>
        {showGame ? (
          <Link
            href={gameHref}
            className="rounded-full bg-white/20 px-4 py-2.5 text-[13px] font-extrabold text-white"
          >
            🎮 Chơi game
          </Link>
        ) : null}
      </div>
      <span
        className="pointer-events-none absolute -right-2.5 -bottom-7 text-[130px] leading-none opacity-[0.18]"
        aria-hidden="true"
      >
        {subjectIcon}
      </span>
    </div>
  )
}
