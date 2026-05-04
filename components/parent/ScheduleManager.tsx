'use client'

/** ScheduleManager — parent panel for adding, editing, and removing class periods via server actions. */

import { useState, useCallback, useEffect, useTransition, useRef } from 'react'
import { Plus, Trash2, Save, Check, AlertCircle, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DailySchedule, DayOfWeek } from '@/types'
import { DAYS_OF_WEEK, DAY_LABELS } from '@/lib/constants'
import { SUBJECTS } from '@/lib/data/subjects'
import {
  createPeriodAction,
  updatePeriodAction,
  deletePeriodAction,
  getScheduleAction,
} from '@/server/actions/schedule.actions'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

type EditablePeriod = {
  tempId: string
  dbId?: string
  subjectId: string
  startTime: string
  endTime: string
  isHomework: boolean
  homeworkNote: string
}

type EditableSchedule = Record<DayOfWeek, EditablePeriod[]>

/** Builds an editable in-memory schedule from DB DailySchedule data, preserving DB IDs. */
const buildEditableSchedule = (schedule: DailySchedule[]): EditableSchedule =>
  DAYS_OF_WEEK.reduce<EditableSchedule>((acc, day) => {
    const daySchedule = schedule.find((d) => d.day === day)
    acc[day] = (daySchedule?.periods ?? []).map((p) => ({
      tempId: p.id ?? `${day}-${p.periodNumber}`,
      dbId: p.id,
      subjectId: p.subjectId,
      startTime: p.startTime,
      endTime: p.endTime,
      isHomework: p.isHomework ?? false,
      homeworkNote: p.homeworkNote ?? '',
    }))
    return acc
  }, {} as EditableSchedule)

/** Extracts all DB IDs from a DailySchedule array. */
const extractDbIds = (schedule: DailySchedule[]): Set<string> =>
  new Set(schedule.flatMap((d) => d.periods.map((p) => p.id).filter(Boolean) as string[]))

interface ScheduleManagerProps {
  initialSchedule: DailySchedule[]
}

export const ScheduleManager = ({ initialSchedule }: ScheduleManagerProps) => {
  const router = useRouter()
  const [editable, setEditable] = useState<EditableSchedule>(() =>
    buildEditableSchedule(initialSchedule)
  )
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday')
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const referenceDbIdsRef = useRef<Set<string>>(extractDbIds(initialSchedule))

  useEffect(() => {
    setEditable(buildEditableSchedule(initialSchedule))
    referenceDbIdsRef.current = extractDbIds(initialSchedule)
  }, [initialSchedule])

  const handleUpdatePeriod = useCallback(
    (
      day: DayOfWeek,
      tempId: string,
      field: keyof Omit<EditablePeriod, 'tempId' | 'dbId'>,
      value: string
    ) => {
      setEditable((prev) => ({
        ...prev,
        [day]: (prev[day] ?? []).map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p)),
      }))
    },
    []
  )

  const handleAddPeriod = useCallback((day: DayOfWeek) => {
    setEditable((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] ?? []),
            {
          tempId: `new-${Date.now()}`,
          subjectId: 'math',
          startTime: '07:30',
          endTime: '08:10',
          isHomework: false,
          homeworkNote: '',
        },
      ],
    }))
  }, [])

  const handleToggleHomework = useCallback((day: DayOfWeek, tempId: string) => {
    setEditable((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((p) =>
        p.tempId === tempId ? { ...p, isHomework: !p.isHomework } : p
      ),
    }))
  }, [])

  const handleDeletePeriod = useCallback((day: DayOfWeek, tempId: string) => {
    setEditable((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((p) => p.tempId !== tempId),
    }))
  }, [])

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const currentDbIds = new Set(
        DAYS_OF_WEEK.flatMap((day) =>
          (editable[day] ?? []).map((p) => p.dbId).filter(Boolean) as string[]
        )
      )

      const deletedIds = [...referenceDbIdsRef.current].filter((id) => !currentDbIds.has(id))
      const deleteResults = await Promise.all(deletedIds.map((id) => deletePeriodAction(id)))
      const deleteError = deleteResults.find((r) => !r.success)
      if (deleteError) {
        setError(deleteError.error ?? 'Không thể xóa tiết học')
        return
      }

      for (const day of DAYS_OF_WEEK) {
        const periods = [...(editable[day] ?? [])]
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((p, i) => ({ ...p, periodNumber: i + 1 }))

        for (const period of periods) {
          if (period.dbId) {
            const result = await updatePeriodAction({
              id: period.dbId,
              subjectId: period.subjectId,
              startTime: period.startTime,
              endTime: period.endTime,
              isHomework: period.isHomework,
              homeworkNote: period.homeworkNote || null,
            })
            if (!result.success) {
              setError(result.error ?? 'Không thể cập nhật tiết học')
              return
            }
          } else {
            const result = await createPeriodAction({
              day,
              periodNumber: period.periodNumber,
              subjectId: period.subjectId,
              startTime: period.startTime,
              endTime: period.endTime,
            })
            if (!result.success) {
              setError(result.error ?? 'Không thể tạo tiết học')
              return
            }
          }
        }
      }

      const freshResult = await getScheduleAction()
      if (freshResult.success && freshResult.data) {
        setEditable(buildEditableSchedule(freshResult.data))
        referenceDbIdsRef.current = extractDbIds(freshResult.data)
      }

      router.refresh()
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2500)
    })
  }

  const activePeriods = editable[activeDay] ?? []

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-700">📅 Thời khóa biểu</h2>
        <KidButton
          variant={isSaved ? 'secondary' : 'primary'}
          onClick={handleSave}
          isDisabled={isPending}
          className="min-h-10 gap-2 px-4 text-sm"
        >
          {isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaved ? 'Đã lưu!' : isPending ? 'Đang lưu...' : 'Lưu'}
        </KidButton>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {DAYS_OF_WEEK.map((dow) => (
          <button
            key={dow}
            onClick={() => setActiveDay(dow)}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-bold transition-colors',
              activeDay === dow
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {DAY_LABELS[dow].replace('Thứ ', '')}
          </button>
        ))}
      </div>

      {/* Period list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {activePeriods.map((period) => (
          <div key={period.tempId} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              {/* Subject select */}
              <select
                value={period.subjectId}
                onChange={(e) =>
                  handleUpdatePeriod(activeDay, period.tempId, 'subjectId', e.target.value)
                }
                className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {/* Start time */}
              <input
                type="time"
                value={period.startTime}
                onChange={(e) =>
                  handleUpdatePeriod(activeDay, period.tempId, 'startTime', e.target.value)
                }
                className="w-28 rounded-xl border-2 border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
              />
              <span className="text-sm font-bold text-slate-400">–</span>
              {/* End time */}
              <input
                type="time"
                value={period.endTime}
                onChange={(e) =>
                  handleUpdatePeriod(activeDay, period.tempId, 'endTime', e.target.value)
                }
                className="w-28 rounded-xl border-2 border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
              />
              {/* Homework toggle */}
              <button
                onClick={() => handleToggleHomework(activeDay, period.tempId)}
                aria-label={period.isHomework ? 'Bỏ đánh dấu bài tập' : 'Đánh dấu là bài tập'}
                aria-pressed={period.isHomework}
                className={cn(
                  'flex min-h-10 min-w-10 items-center justify-center rounded-xl p-2 transition-colors',
                  period.isHomework
                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                    : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                )}
              >
                <BookOpen size={18} />
              </button>
              {/* Delete */}
              <button
                onClick={() => handleDeletePeriod(activeDay, period.tempId)}
                aria-label="Xóa tiết học"
                className="flex min-h-10 min-w-10 items-center justify-center rounded-xl p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Homework note — visible only when period is marked as homework */}
            {period.isHomework && (
              <input
                type="text"
                placeholder="Ghi chú bài tập (vd: Làm bài 1–5 trang 24)"
                value={period.homeworkNote}
                maxLength={200}
                onChange={(e) =>
                  handleUpdatePeriod(activeDay, period.tempId, 'homeworkNote', e.target.value)
                }
                className="rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
              />
            )}
          </div>
        ))}

        {/* Add period button */}
        <button
          onClick={() => handleAddPeriod(activeDay)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-500"
        >
          <Plus size={18} />
          Thêm tiết học
        </button>
      </div>
    </div>
  )
}
