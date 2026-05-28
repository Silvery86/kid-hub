'use client'

/**
 * ScheduleManager — parent panel for managing school periods, recurring extra classes,
 * and daily homework. Sections: School Periods (Mon–Fri) · Evening Extra Classes (Mon–Sun) ·
 * Quick-Add Homework.
 */

import { useState, useCallback, useTransition, useRef, useEffect } from 'react'
import { Plus, Trash2, Save, Check, AlertCircle, X, Moon, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DailySchedule, DayOfWeek } from '@/types'
import { SCHOOL_DAYS, DAY_LABELS, MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'
import { SUBJECTS } from '@/lib/data/subjects'
import { ICON_MAP } from '@/lib/icons'
import {
  createPeriodAction,
  updatePeriodAction,
  deletePeriodAction,
  getScheduleAction,
  createExtraClassAction,
  addDailyHomeworkAction,
} from '@/server/actions/schedule.actions'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────

type EditablePeriod = {
  tempId: string
  dbId?: string
  subjectId: string
  startTime: string
  endTime: string
}

type EditableSchedule = Record<DayOfWeek, EditablePeriod[]>

type HomeworkDraft = {
  date: string
  subjectId: string
  label: string
  iconKey: string
  points: number
}

type ActiveTab = 'school' | 'evening' | 'homework'

// ── Helpers ───────────────────────────────────────────────────

const buildEditableSchedule = (schedule: DailySchedule[]): EditableSchedule =>
  SCHOOL_DAYS.reduce<EditableSchedule>((acc, day) => {
    const daySchedule = schedule.find((d) => d.day === day)
    acc[day] = (daySchedule?.periods ?? []).map((p) => ({
      tempId: p.id ?? `${day}-${p.periodNumber}`,
      dbId: p.id,
      subjectId: p.subjectId,
      startTime: p.startTime,
      endTime: p.endTime,
    }))
    return acc
  }, {} as EditableSchedule)

const extractDbIds = (schedule: DailySchedule[]): Set<string> =>
  new Set(schedule.flatMap((d) => d.periods.map((p) => p.id).filter(Boolean) as string[]))

const todayStr = (): string => new Date().toISOString().split('T')[0]!

// ── Component ─────────────────────────────────────────────────

export interface ParentSaveState {
  save: () => void
  isPending: boolean
  isSaved: boolean
}

interface ScheduleManagerProps {
  initialSchedule: DailySchedule[]
  embedded?: boolean
  onSaveStateChange?: (state: ParentSaveState) => void
}

export const ScheduleManager = ({
  initialSchedule,
  embedded = false,
  onSaveStateChange,
}: ScheduleManagerProps) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('school')
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday')
  const [eveningDay, setEveningDay] = useState<DayOfWeek>('monday')

  // School periods state
  const [editable, setEditable] = useState<EditableSchedule>(() =>
    buildEditableSchedule(initialSchedule)
  )
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const referenceDbIdsRef = useRef<Set<string>>(extractDbIds(initialSchedule))

  // Evening extra class state
  const [eveningForm, setEveningForm] = useState({
    subjectId: 'english',
    startTime: '18:00',
    endTime: '19:30',
    iconKey: 'english',
  })
  const [eveningError, setEveningError] = useState<string | null>(null)
  const [eveningPending, startEveningTransition] = useTransition()

  // Daily homework state
  const [hwDraft, setHwDraft] = useState<HomeworkDraft>({
    date: todayStr(),
    subjectId: 'math',
    label: '',
    iconKey: 'book',
    points: 10,
  })
  const [hwError, setHwError] = useState<string | null>(null)
  const [hwSaved, setHwSaved] = useState(false)
  const [hwPending, startHwTransition] = useTransition()

  // ── School period handlers ──────────────────────────────────

  const handleUpdatePeriod = useCallback(
    (day: DayOfWeek, tempId: string, field: keyof Omit<EditablePeriod, 'tempId' | 'dbId'>, value: string) => {
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
        { tempId: `new-${Date.now()}`, subjectId: 'math', startTime: '07:30', endTime: '08:10' },
      ],
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
        SCHOOL_DAYS.flatMap((day) =>
          (editable[day] ?? []).map((p) => p.dbId).filter(Boolean) as string[]
        )
      )
      const deletedIds = [...referenceDbIdsRef.current].filter((id) => !currentDbIds.has(id))
      const deleteResults = await Promise.all(deletedIds.map((id) => deletePeriodAction(id)))
      const deleteError = deleteResults.find((r) => !r.success)
      if (deleteError) { setError(deleteError.error ?? 'Không thể xóa tiết học'); return }

      for (const day of SCHOOL_DAYS) {
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
            })
            if (!result.success) { setError(result.error ?? 'Không thể cập nhật tiết học'); return }
          } else {
            const result = await createPeriodAction({
              day,
              periodNumber: period.periodNumber,
              subjectId: period.subjectId,
              startTime: period.startTime,
              endTime: period.endTime,
            })
            if (!result.success) { setError(result.error ?? 'Không thể tạo tiết học'); return }
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

  useEffect(() => {
    onSaveStateChange?.({ save: handleSave, isPending, isSaved })
  }, [onSaveStateChange, isPending, isSaved])

  // ── Evening extra class handler ─────────────────────────────

  const handleAddEvening = () => {
    setEveningError(null)
    startEveningTransition(async () => {
      const result = await createExtraClassAction({
        day: eveningDay,
        subjectId: eveningForm.subjectId,
        startTime: eveningForm.startTime,
        endTime: eveningForm.endTime,
        iconKey: eveningForm.iconKey,
      })
      if (!result.success) { setEveningError(result.error ?? 'Lỗi khi thêm'); return }
      router.refresh()
      setEveningForm({ subjectId: 'english', startTime: '18:00', endTime: '19:30', iconKey: 'english' })
    })
  }

  // ── Daily homework handler ──────────────────────────────────

  const handleAddHomework = () => {
    if (!hwDraft.label.trim()) { setHwError('Vui lòng nhập nội dung bài tập'); return }
    setHwError(null)
    startHwTransition(async () => {
      const result = await addDailyHomeworkAction({
        date: hwDraft.date,
        subjectId: hwDraft.subjectId,
        label: hwDraft.label.trim(),
        iconKey: hwDraft.iconKey,
        points: hwDraft.points,
      })
      if (!result.success) { setHwError(result.error ?? 'Lỗi khi thêm bài tập'); return }
      router.refresh()
      setHwDraft((d) => ({ ...d, label: '' }))
      setHwSaved(true)
      setTimeout(() => setHwSaved(false), 2000)
    })
  }

  const activePeriods = editable[activeDay] ?? []

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {([['school', '🎒 Buổi Sáng'], ['evening', '🌙 Buổi Tối'], ['homework', '📚 Bài Tập']] as const).map(
          ([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 rounded-xl py-2 text-xs font-bold transition-colors',
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* ── School periods tab ── */}
      {activeTab === 'school' && (
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {!embedded ? (
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">Thời khoá biểu chính</p>
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
          ) : null}

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Day tabs */}
          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
            {SCHOOL_DAYS.map((dow) => (
              <button
                key={dow}
                onClick={() => setActiveDay(dow)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-bold transition-colors',
                  activeDay === dow ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {DAY_LABELS[dow].replace('Thứ ', '')}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {activePeriods.map((period) => (
              <div key={period.tempId} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                <select
                  value={period.subjectId}
                  onChange={(e) => handleUpdatePeriod(activeDay, period.tempId, 'subjectId', e.target.value)}
                  className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="time" value={period.startTime}
                  onChange={(e) => handleUpdatePeriod(activeDay, period.tempId, 'startTime', e.target.value)}
                  className="w-28 rounded-xl border-2 border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                />
                <span className="text-sm font-bold text-slate-400">–</span>
                <input type="time" value={period.endTime}
                  onChange={(e) => handleUpdatePeriod(activeDay, period.tempId, 'endTime', e.target.value)}
                  className="w-28 rounded-xl border-2 border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                />
                <button onClick={() => handleDeletePeriod(activeDay, period.tempId)}
                  aria-label="Xóa tiết học"
                  className="flex min-h-10 min-w-10 items-center justify-center rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button onClick={() => handleAddPeriod(activeDay)}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-500"
            >
              <Plus size={18} /> Thêm tiết học
            </button>
          </div>
        </div>
      )}

      {/* ── Evening extra classes tab ── */}
      {activeTab === 'evening' && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <p className="text-sm font-bold text-slate-500">
            Lớp học thêm buổi tối (tối đa {MAX_EVENING_BLOCKS_PER_DAY} buổi/ngày)
          </p>

          {eveningError && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              <AlertCircle size={16} /> {eveningError}
            </div>
          )}

          {/* Day selector (Mon–Sun) */}
          <div className="grid grid-cols-7 gap-1 rounded-2xl bg-slate-100 p-1">
            {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as DayOfWeek[]).map((dow) => (
              <button key={dow} onClick={() => setEveningDay(dow)}
                className={cn(
                  'rounded-xl py-2 text-xs font-bold transition-colors',
                  eveningDay === dow ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {DAY_LABELS[dow].replace('Thứ ', '').replace('Chủ ', 'CN')}
              </button>
            ))}
          </div>

          {/* Add evening block form */}
          <div className="flex flex-col gap-3 rounded-2xl bg-violet-50 p-4">
            <p className="text-sm font-extrabold text-violet-800 flex items-center gap-1">
              <Moon size={14} /> Thêm buổi học — {DAY_LABELS[eveningDay]}
            </p>
            <div className="flex flex-wrap gap-2">
              <select value={eveningForm.subjectId}
                onChange={(e) => setEveningForm((f) => ({ ...f, subjectId: e.target.value }))}
                className="flex-1 rounded-xl border-2 border-violet-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
              >
                {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={eveningForm.iconKey}
                onChange={(e) => setEveningForm((f) => ({ ...f, iconKey: e.target.value }))}
                className="rounded-xl border-2 border-violet-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
              >
                {Object.entries(ICON_MAP).map(([key, val]) => (
                  <option key={key} value={key}>{val.emoji} {val.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="time" value={eveningForm.startTime}
                onChange={(e) => setEveningForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-28 rounded-xl border-2 border-violet-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
              />
              <span className="text-sm font-bold text-slate-400">–</span>
              <input type="time" value={eveningForm.endTime}
                onChange={(e) => setEveningForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-28 rounded-xl border-2 border-violet-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
              />
              <KidButton variant="primary" onClick={handleAddEvening} isDisabled={eveningPending}
                className="ml-auto min-h-10 gap-1 px-4 text-sm">
                <Plus size={16} /> {eveningPending ? 'Đang lưu...' : 'Thêm'}
              </KidButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily homework tab ── */}
      {activeTab === 'homework' && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <p className="text-sm font-bold text-slate-500">
            Thêm bài tập cho một ngày cụ thể
          </p>

          {hwError && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              <AlertCircle size={16} /> {hwError}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4">
            <p className="text-sm font-extrabold text-amber-800 flex items-center gap-1">
              <BookOpen size={14} /> Thêm bài về nhà
            </p>

            {/* Date */}
            <input type="date" value={hwDraft.date}
              onChange={(e) => setHwDraft((d) => ({ ...d, date: e.target.value }))}
              className="rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:outline-none"
            />

            {/* Subject + icon */}
            <div className="flex gap-2">
              <select value={hwDraft.subjectId}
                onChange={(e) => setHwDraft((d) => ({ ...d, subjectId: e.target.value }))}
                className="flex-1 rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:outline-none"
              >
                {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={hwDraft.iconKey}
                onChange={(e) => setHwDraft((d) => ({ ...d, iconKey: e.target.value }))}
                className="rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:outline-none"
              >
                {Object.entries(ICON_MAP).map(([key, val]) => (
                  <option key={key} value={key}>{val.emoji} {val.label}</option>
                ))}
              </select>
            </div>

            {/* Label */}
            <input type="text" placeholder="Nội dung bài tập (vd: Toán trang 12, bài 3–5)"
              value={hwDraft.label} maxLength={150}
              onChange={(e) => setHwDraft((d) => ({ ...d, label: e.target.value }))}
              className="rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
            />

            {/* Points */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-800">⭐ Điểm thưởng:</span>
              <input type="number" min={1} max={50} value={hwDraft.points}
                onChange={(e) => setHwDraft((d) => ({ ...d, points: Math.min(50, Math.max(1, Number(e.target.value))) }))}
                className="w-20 rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:outline-none"
              />
              <KidButton variant="primary" onClick={handleAddHomework} isDisabled={hwPending}
                className="ml-auto min-h-10 gap-1 px-4 text-sm">
                {hwSaved ? <><Check size={16} /> Đã thêm!</> : <><Plus size={16} /> {hwPending ? 'Đang lưu...' : 'Thêm'}</>}
              </KidButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
