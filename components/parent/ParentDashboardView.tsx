'use client'

import { useCallback, useState } from 'react'
import type { DailySchedule, SubjectGrade } from '@/types'
import { cn } from '@/lib/utils'
import { ParentHeader } from './ParentHeader'
import { ParentManagerPanel } from './ParentManagerPanel'
import { ParentSaveButton } from './ParentSaveButton'
import { ScheduleManager, type ParentSaveState } from './ScheduleManager'
import { GradesManager } from './GradesManager'

type ManagerTab = 'schedule' | 'grades'

export function ParentDashboardView({
  initialSchedule,
  initialGrades,
}: {
  initialSchedule: DailySchedule[]
  initialGrades: SubjectGrade[]
}) {
  const [activeTab, setActiveTab] = useState<ManagerTab>('schedule')
  const [scheduleSave, setScheduleSave] = useState<ParentSaveState | null>(null)
  const [gradesSave, setGradesSave] = useState<ParentSaveState | null>(null)

  const onScheduleSaveState = useCallback((state: ParentSaveState) => {
    setScheduleSave(state)
  }, [])

  const onGradesSaveState = useCallback((state: ParentSaveState) => {
    setGradesSave(state)
  }, [])

  const schedulePanel = (
    <ParentManagerPanel
      compact
      title="📅 Thời khóa biểu"
      className="h-full"
      action={
        scheduleSave ? (
          <ParentSaveButton
            onClick={scheduleSave.save}
            isPending={scheduleSave.isPending}
            isSaved={scheduleSave.isSaved}
          />
        ) : null
      }
    >
      <ScheduleManager
        initialSchedule={initialSchedule}
        embedded
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
      {/* Phone portrait: tabbed single panel */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="shrink-0 px-3.5 pt-3">
          <ParentHeader compact />
          <div className="mb-2.5 flex gap-1 rounded-2xl bg-white p-1 shadow-sm">
            {(
              [
                { id: 'schedule' as const, label: '📅 Lịch học' },
                { id: 'grades' as const, label: '🌟 Điểm số' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex-1 rounded-xl py-2.5 text-[13px] font-extrabold transition-colors',
                  activeTab === t.id ? 'bg-blue-500 text-white' : 'text-slate-500'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 px-3.5 pb-3">
          {activeTab === 'schedule' ? schedulePanel : gradesPanel}
        </div>
      </div>

      {/* Tablet / desktop: two columns */}
      <div className="hidden min-h-0 flex-1 flex-col p-4 md:flex md:p-5 lg:p-6">
        <ParentHeader />
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 lg:gap-6">
          <div className="flex min-h-0 flex-col">{schedulePanel}</div>
          <div className="flex min-h-0 flex-col">{gradesPanel}</div>
        </div>
      </div>
    </div>
  )
}
