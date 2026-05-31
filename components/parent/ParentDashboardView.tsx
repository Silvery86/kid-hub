'use client'

import { useCallback, useMemo, useState } from 'react'
import type { DailySchedule, SubjectGrade, TodayView } from '@/types'
import { cn } from '@/lib/utils'
import { formatWeekSubtitleForOffset, getWeekDates } from '@/lib/schedule-display'
import { ParentHeader } from './ParentHeader'
import { ParentManagerPanel } from './ParentManagerPanel'
import { ParentSaveButton } from './ParentSaveButton'
import { ScheduleManager, type ParentSaveState } from './ScheduleManager'
import { GradesManager } from './GradesManager'
import { TodayOverviewPanel } from './TodayOverviewPanel'

type ManagerTab = 'today' | 'schedule' | 'grades'

const TABS = [
  { id: 'today' as const, label: '🏠 Hôm nay' },
  { id: 'schedule' as const, label: '📅 Lịch học' },
  { id: 'grades' as const, label: '🌟 Điểm số' },
]

export function ParentDashboardView({
  initialSchedule,
  initialGrades,
  todayView,
}: {
  initialSchedule: DailySchedule[]
  initialGrades: SubjectGrade[]
  todayView: TodayView | null
}) {
  const [activeTab, setActiveTab] = useState<ManagerTab>('today')
  const [scheduleSave, setScheduleSave] = useState<ParentSaveState | null>(null)
  const [gradesSave, setGradesSave] = useState<ParentSaveState | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const isPastWeek = weekOffset < 0
  const weekLabel = weekOffset === 0 ? 'Tuần này' : formatWeekSubtitleForOffset(weekOffset)
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  const onScheduleSaveState = useCallback((state: ParentSaveState) => {
    setScheduleSave(state)
  }, [])

  const onGradesSaveState = useCallback((state: ParentSaveState) => {
    setGradesSave(state)
  }, [])

  const todayPanel = (
    <ParentManagerPanel compact title="🏠 Hôm nay" className="h-full">
      {todayView ? (
        <TodayOverviewPanel todayView={todayView} compact />
      ) : (
        <div className="flex flex-1 items-center justify-center py-8 text-sm font-bold text-slate-400">
          Không thể tải dữ liệu hôm nay
        </div>
      )}
    </ParentManagerPanel>
  )

  const weekNav = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setWeekOffset((o) => o - 1)}
        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold text-slate-500 hover:bg-slate-50"
        aria-label="Tuần trước"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => setWeekOffset(0)}
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-extrabold',
          weekOffset === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        )}
      >
        {weekOffset === 0 ? 'Tuần này' : weekLabel.split('·')[0]?.trim()}
      </button>
      <button
        type="button"
        onClick={() => setWeekOffset((o) => o + 1)}
        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold text-slate-500 hover:bg-slate-50"
        aria-label="Tuần sau"
      >
        →
      </button>
    </div>
  )

  const schedulePanel = (
    <ParentManagerPanel
      compact
      title="📅 Thời khóa biểu"
      className="h-full"
      action={
        isPastWeek ? weekNav : (
          scheduleSave ? (
            <div className="flex items-center gap-2">
              {weekNav}
              <ParentSaveButton
                onClick={scheduleSave.save}
                isPending={scheduleSave.isPending}
                isSaved={scheduleSave.isSaved}
              />
            </div>
          ) : weekNav
        )
      }
    >
      <ScheduleManager
        initialSchedule={initialSchedule}
        embedded
        readOnly={isPastWeek}
        weekDates={weekDates}
        onSaveStateChange={onScheduleSaveState}
      />
    </ParentManagerPanel>
  )

  const gradesPanel = (
    <ParentManagerPanel
      compact
      title="🌟 Điểm số"
      className="h-full"
      action={
        gradesSave ? (
          <ParentSaveButton
            onClick={gradesSave.save}
            isPending={gradesSave.isPending}
            isSaved={gradesSave.isSaved}
          />
        ) : null
      }
    >
      <GradesManager initialGrades={initialGrades} embedded onSaveStateChange={onGradesSaveState} />
    </ParentManagerPanel>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* Phone: tabbed 3-panel layout */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="shrink-0 px-3.5 pt-3">
          <ParentHeader compact />
          <div className="mb-2.5 flex gap-1 rounded-2xl bg-white p-1 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex-1 rounded-xl py-2.5 text-[11px] font-extrabold transition-colors',
                  activeTab === t.id ? 'bg-blue-500 text-white' : 'text-slate-500'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 px-3.5 pb-3">
          {activeTab === 'today' && todayPanel}
          {activeTab === 'schedule' && schedulePanel}
          {activeTab === 'grades' && gradesPanel}
        </div>
      </div>

      {/* Tablet / desktop: three-column layout */}
      <div className="hidden min-h-0 flex-1 flex-col p-4 md:flex md:p-5 lg:p-6">
        <ParentHeader />
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 lg:gap-5">
          <div className="flex min-h-0 flex-col">{todayPanel}</div>
          <div className="flex min-h-0 flex-col">{schedulePanel}</div>
          <div className="flex min-h-0 flex-col">{gradesPanel}</div>
        </div>
      </div>
    </div>
  )
}
