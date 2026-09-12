'use client'

/**
 * ScheduleManager — parent panel for managing school periods, recurring extra classes,
 * and daily homework. Sections: School Periods (Mon–Fri) · Evening Extra Classes (Mon–Sun) ·
 * Quick-Add Homework.
 */

import { useState, useCallback, useMemo, useRef, useTransition } from 'react'
import { Plus, Trash2, Check, AlertCircle, Moon, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { BellSlot, DailyHomework, DailySchedule, DayOfWeek, SchoolBreak, WeekSource } from '@/types'
import { DAY_LABELS, MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'
import { canEditDatedEntry, canEditRecurringEntry } from '@/lib/schedule-locks'
import { WeekGrid } from '@/components/parent/schedule/WeekGrid'
import { getSubjectById, subjectGroupsForPicker } from '@kid-hub/shared'
import { ICON_MAP } from '@/lib/icons'
import {
  deletePeriodAction,
  getScheduleAction,
  getAllEveningBlocksAction,
  createExtraClassAction,
  addDailyHomeworkAction,
  deleteDailyHomeworkAction,
  getDailyHomeworkByDateAction,
} from '@/server/actions/schedule.actions'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────

type EditablePeriod = {
  tempId: string
  dbId?: string
  periodNumber?: number | null
  eventType?: 'SCHOOL_PERIOD' | 'EXTRA_CLASS'
  subjectId: string
  note?: string
  startTime: string
  endTime: string
  iconKey?: string
}

type EditableSchedule = Record<DayOfWeek, EditablePeriod[]>

type HomeworkDraft = {
  date: string
  subjectId: string
  label: string
  iconKey: string
  points: number
}

type HomeworkListItem = {
  id: string
  date: string
  subjectId: string
  label: string
  iconKey: string
  points: number
  isDone: boolean
}

type ActiveTab = 'school' | 'evening' | 'homework'

const ALL_DAYS: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

// ── Helpers ───────────────────────────────────────────────────

const buildEditableSchedule = (schedule: DailySchedule[]): EditableSchedule =>
  ALL_DAYS.reduce<EditableSchedule>((acc, day) => {
    const daySchedule = schedule.find((d) => d.day === day)
    acc[day] = (daySchedule?.periods ?? []).map((p) => ({
      tempId: p.id ?? `${day}-${p.periodNumber}`,
      dbId: p.id,
      periodNumber: p.periodNumber,
      eventType: p.eventType,
      subjectId: p.subjectId,
      ...(p.note ? { note: p.note } : {}),
      startTime: p.startTime,
      endTime: p.endTime,
    }))
    return acc
  }, {} as EditableSchedule)

const extractDbIds = (schedule: DailySchedule[]): Set<string> =>
  new Set(
    schedule.flatMap((d) =>
      d.periods
        .filter((p) => p.periodNumber != null)
        .map((p) => p.id)
        .filter(Boolean) as string[]
    )
  )

const todayStr = (): string => new Date().toISOString().split('T')[0]!

const ddMmToIsoDate = (ddMm: string): string => {
  const [ddRaw, mmRaw] = ddMm.split('/')
  const dd = Number(ddRaw)
  const mm = Number(mmRaw)
  const now = new Date()
  let year = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (currentMonth === 1 && mm === 12) year -= 1
  if (currentMonth === 12 && mm === 1) year += 1
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

const localTodayIso = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}


const mergeSchedules = (school: DailySchedule[], evening: DailySchedule[]): DailySchedule[] =>
  ALL_DAYS.map((day) => {
    const schoolDay = school.find((d) => d.day === day)
    const eveningDay = evening.find((d) => d.day === day)
    return {
      day,
      periods: [...(schoolDay?.periods ?? []), ...(eveningDay?.periods ?? [])],
    }
  })

const mapHomeworkItems = (items: DailyHomework[]): HomeworkListItem[] =>
  items
    .map((item) => ({
      id: item.id,
      date: item.date,
      subjectId: item.subjectId,
      label: item.label,
      iconKey: item.iconKey ?? 'book',
      points: item.points,
      isDone: item.isDone,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

// ── Component ─────────────────────────────────────────────────

export interface ParentSaveState {
  save: () => void
  isPending: boolean
  isSaved: boolean
}

interface ScheduleManagerProps {
  initialSchedule: DailySchedule[]
  /** Period times for the week grid. Empty until a bell schedule exists. */
  bellSlots?: BellSlot[]
  /** The Monday the schedule panel is showing (Phase 6). */
  weekStartDate: string
  /** Holidays and nghỉ hè (Phase 7). */
  breaks?: SchoolBreak[]
  /** Whether `initialSchedule` is that week's own rows or an earlier week's. */
  initialWeekSource?: WeekSource
  initialInheritedFrom?: string
  embedded?: boolean
  readOnly?: boolean
  weekDates?: Record<DayOfWeek, string>
  /** Decides which subjects every picker here offers. 0 falls back to the catalogue. */
  gradeLevel: number
}

export const ScheduleManager = ({
  initialSchedule,
  bellSlots = [],
  weekStartDate,
  breaks = [],
  initialWeekSource,
  initialInheritedFrom,
  embedded: _embedded = false,
  readOnly = false,
  weekDates,
  gradeLevel,
}: ScheduleManagerProps) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('school')
  const [eveningDay, setEveningDay] = useState<DayOfWeek>('monday')
  const [homeworkDay, setHomeworkDay] = useState<DayOfWeek>('monday')

  // School periods state
  const [editable, setEditable] = useState<EditableSchedule>(() =>
    buildEditableSchedule(initialSchedule)
  )
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
    date: weekDates?.monday ? ddMmToIsoDate(weekDates.monday) : todayStr(),
    subjectId: 'math',
    label: '',
    iconKey: 'book',
    points: 10,
  })
  const [homeworkByDay, setHomeworkByDay] = useState<Record<DayOfWeek, HomeworkListItem[]>>(
    () =>
      ALL_DAYS.reduce((acc, day) => {
        acc[day] = []
        return acc
      }, {} as Record<DayOfWeek, HomeworkListItem[]>)
  )
  const [hwError, setHwError] = useState<string | null>(null)
  const [hwSaved, setHwSaved] = useState(false)
  const [hwPending, startHwTransition] = useTransition()
  const todayIso = localTodayIso()
  const selectedHomeworkDate = weekDates?.[homeworkDay]
    ? ddMmToIsoDate(weekDates[homeworkDay])
    : hwDraft.date

  // School periods and extra classes are recurring weekly templates — no date,
  // so no date lock. Homework carries a real date and keeps the rule.
  const canEditPeriods = !readOnly && canEditRecurringEntry()
  const homeworkAddLocked = readOnly || !canEditDatedEntry(selectedHomeworkDate, todayIso)

  const loadHomeworkByDay = useCallback(async (day: DayOfWeek, date: string) => {
    const result = await getDailyHomeworkByDateAction(date)
    if (!result.success) {
      setHwError(result.error ?? 'Không thể tải danh sách bài tập')
      return
    }
    setHwError(null)
    setHomeworkByDay((prev) => ({
      ...prev,
      [day]: mapHomeworkItems(result.data ?? []),
    }))
  }, [])

  const refreshScheduleData = useCallback(async () => {
    const [schoolResult, eveningResult] = await Promise.all([
      getScheduleAction(),
      getAllEveningBlocksAction(),
    ])
    if (!schoolResult.success) return
    if (!eveningResult.success) {
      setEveningError(eveningResult.error ?? 'Không thể tải buổi học tối')
      return
    }
    const merged = mergeSchedules(schoolResult.data ?? [], eveningResult.data ?? [])
    setEditable(buildEditableSchedule(merged))
    referenceDbIdsRef.current = extractDbIds(merged)
  }, [])

  // ── Evening extra class handler ─────────────────────────────

  const handleAddEvening = () => {
    if (!canEditPeriods) return
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
      await refreshScheduleData()
      router.refresh()
      setEveningForm({ subjectId: 'english', startTime: '18:00', endTime: '19:30', iconKey: 'english' })
    })
  }

  // ── Daily homework handler ──────────────────────────────────

  const handleAddHomework = () => {
    if (homeworkAddLocked) return
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
      await loadHomeworkByDay(homeworkDay, hwDraft.date)
      setHwDraft((d) => ({ ...d, label: '' }))
      setHwSaved(true)
      setTimeout(() => setHwSaved(false), 2000)
    })
  }

  const handleSelectHomeworkDay = (dow: DayOfWeek) => {
    const nextDate = weekDates?.[dow] ? ddMmToIsoDate(weekDates[dow]) : hwDraft.date
    setHomeworkDay(dow)
    if (weekDates?.[dow]) {
      setHwDraft((prev) => ({ ...prev, date: nextDate }))
    }
    void loadHomeworkByDay(dow, nextDate)
  }

  // Memoised because the subject pickers below depend on them: rebuilt every
  // render, these two arrays would give the memos a new identity each time and
  // regroup the whole catalogue on every keystroke.
  const eveningPeriods = useMemo(
    () =>
      [...(editable[eveningDay] ?? [])]
        .filter((period) => period.periodNumber == null)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [editable, eveningDay]
  )
  const homeworkItems = useMemo(
    () => homeworkByDay[homeworkDay] ?? [],
    [homeworkByDay, homeworkDay]
  )

  // Both pickers below offer the grade's programme, plus whatever the day's
  // existing rows already reference — otherwise an evening block recorded under
  // a subject this grade no longer teaches would show as a blank <select>.
  const eveningSubjectGroups = useMemo(
    () =>
      subjectGroupsForPicker(gradeLevel, [
        eveningForm.subjectId,
        ...eveningPeriods.map((p) => p.subjectId),
      ]),
    [gradeLevel, eveningForm.subjectId, eveningPeriods]
  )
  const homeworkSubjectGroups = useMemo(
    () =>
      subjectGroupsForPicker(gradeLevel, [
        hwDraft.subjectId,
        ...homeworkItems.map((h) => h.subjectId),
      ]),
    [gradeLevel, hwDraft.subjectId, homeworkItems]
  )

  const handleDeleteEveningClass = (period: EditablePeriod) => {
    if (readOnly || !period.dbId) return
    const periodId = period.dbId
    setEveningError(null)
    startEveningTransition(async () => {
      const result = await deletePeriodAction(periodId)
      if (!result.success) {
        setEveningError(result.error ?? 'Không thể xóa buổi học')
        return
      }
      await refreshScheduleData()
      router.refresh()
    })
  }

  const handleDeleteHomework = (itemId: string) => {
    if (readOnly) return
    setHwError(null)
    startHwTransition(async () => {
      const result = await deleteDailyHomeworkAction(itemId)
      if (!result.success) {
        setHwError(result.error ?? 'Không thể xóa bài tập')
        return
      }
      await loadHomeworkByDay(homeworkDay, selectedHomeworkDate)
      router.refresh()
    })
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {([['school', '🎒 Buổi Sáng'], ['evening', '🌙 Buổi Tối'], ['homework', '📚 Bài Tập']] as const).map(
          ([tab, label]) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'evening') {
                  void refreshScheduleData()
                }
                if (tab === 'homework') {
                  void loadHomeworkByDay(homeworkDay, selectedHomeworkDate)
                }
              }}
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

      {/* Read-only notice */}
      {readOnly && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-700">
          🔒 Tuần đã qua — chỉ xem, không thể chỉnh sửa
        </div>
      )}

      {/* ── School periods tab ── */}
      {activeTab === 'school' && (
        <div className="flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">Thời khóa biểu</p>
            <span className="text-xs font-bold text-slate-400">Cả tuần</span>
          </div>
          <WeekGrid
            weekStartDate={weekStartDate}
            breaks={breaks}
            initialSchedule={initialSchedule}
            initialSource={initialWeekSource}
            initialInheritedFrom={initialInheritedFrom}
            bellSlots={bellSlots}
            gradeLevel={gradeLevel}
            readOnly={readOnly}
            onSaved={() => router.refresh()}
          />
        </div>
      )}


      {/* ── Evening extra classes tab ── */}
      {activeTab === 'evening' && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
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
                  'rounded-xl py-1.5 text-xs font-bold transition-colors',
                  eveningDay === dow ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <div>{DAY_LABELS[dow].replace('Thứ ', '').replace('Chủ ', 'CN')}</div>
                {weekDates?.[dow] ? (
                  <div className={cn('text-[9px] font-semibold leading-tight', eveningDay === dow ? 'text-violet-400' : 'text-slate-400')}>
                    {weekDates[dow]}
                  </div>
                ) : null}
              </button>
            ))}
          </div>

          {/* Add evening block form — hidden when read-only */}
          {!readOnly && (
            <div className="flex flex-col gap-3 rounded-2xl bg-violet-50/60 p-4">
              <p className="flex items-center gap-1 text-sm font-extrabold text-violet-800">
                <Moon size={14} /> Thêm buổi học — {DAY_LABELS[eveningDay]}
              </p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={eveningForm.subjectId}
                  onChange={(e) => setEveningForm((f) => ({ ...f, subjectId: e.target.value }))}
                  className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
                >
                  {eveningSubjectGroups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <select
                  value={eveningForm.iconKey}
                  onChange={(e) => setEveningForm((f) => ({ ...f, iconKey: e.target.value }))}
                  className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
                >
                  {Object.entries(ICON_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val.emoji} {val.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={eveningForm.startTime}
                  onChange={(e) => setEveningForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-28 rounded-xl border border-violet-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
                />
                <span className="text-sm font-bold text-slate-400">–</span>
                <input
                  type="time"
                  value={eveningForm.endTime}
                  onChange={(e) => setEveningForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-28 rounded-xl border border-violet-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-violet-400 focus:outline-none"
                />
                <KidButton
                  variant="primary"
                  onClick={handleAddEvening}
                  isDisabled={eveningPending || !canEditPeriods}
                  className="ml-auto min-h-10 gap-1 px-4 text-sm">
                  <><Plus size={16} /> {eveningPending ? 'Đang lưu...' : 'Thêm'}</>
                </KidButton>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {eveningPeriods.map((period) => {
              const subject = getSubjectById(period.subjectId)
              const icon = ICON_MAP[period.iconKey ?? 'book']
              return (
                <div
                  key={period.tempId}
                  className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-700">
                      {icon?.emoji ?? '🌙'} {subject?.name ?? period.subjectId}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-600">
                    <span>{period.startTime}</span>
                    <span className="text-slate-300">–</span>
                    <span>{period.endTime}</span>
                  </div>
                  {canEditPeriods && (
                    <button
                      onClick={() => handleDeleteEveningClass(period)}
                      aria-label="Xóa buổi tối"
                      className="flex min-h-10 min-w-10 items-center justify-center rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )
            })}
            {eveningPeriods.length === 0 ? (
              <p className="py-6 text-center text-sm font-bold text-slate-400">
                Chưa có buổi học tối cho {DAY_LABELS[eveningDay]}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Daily homework tab ── */}
      {activeTab === 'homework' && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
          <p className="text-sm font-bold text-slate-500">
            {readOnly ? 'Bài tập đã giao (chỉ xem)' : 'Thêm bài tập cho một ngày cụ thể'}
          </p>

          <div className="grid grid-cols-7 gap-1 rounded-2xl bg-slate-100 p-1">
            {ALL_DAYS.map((dow) => (
              <button
                key={dow}
                onClick={() => handleSelectHomeworkDay(dow)}
                className={cn(
                  'rounded-xl py-1.5 text-xs font-bold transition-colors',
                  homeworkDay === dow ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <div>{DAY_LABELS[dow].replace('Thứ ', '').replace('Chủ ', 'CN')}</div>
                {weekDates?.[dow] ? (
                  <div
                    className={cn(
                      'text-[9px] font-semibold leading-tight',
                      homeworkDay === dow ? 'text-amber-500' : 'text-slate-400'
                    )}
                  >
                    {weekDates[dow]}
                  </div>
                ) : null}
              </button>
            ))}
          </div>

          {hwError && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              <AlertCircle size={16} /> {hwError}
            </div>
          )}

          {!readOnly && (
            <div className="flex flex-col gap-3 rounded-2xl bg-amber-50/60 p-4">
              <p className="flex items-center gap-1 text-sm font-extrabold text-amber-800">
                <BookOpen size={14} /> Thêm bài về nhà — {DAY_LABELS[homeworkDay]}
              </p>

              {/* Subject + icon */}
              <div className="flex gap-2">
                <select value={hwDraft.subjectId}
                  onChange={(e) => setHwDraft((d) => ({ ...d, subjectId: e.target.value }))}
                  className="flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:outline-none"
                >
                  {homeworkSubjectGroups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <select value={hwDraft.iconKey}
                  onChange={(e) => setHwDraft((d) => ({ ...d, iconKey: e.target.value }))}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:outline-none"
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
                className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
              />

              {/* Points */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-800">⭐ Điểm thưởng:</span>
                <input type="number" min={1} max={50} value={hwDraft.points}
                  onChange={(e) => setHwDraft((d) => ({ ...d, points: Math.min(50, Math.max(1, Number(e.target.value))) }))}
                  className="w-20 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:outline-none"
                />
                <KidButton
                  variant="primary"
                  onClick={handleAddHomework}
                  isDisabled={hwPending || homeworkAddLocked}
                  className="ml-auto min-h-10 gap-1 px-4 text-sm">
                  {homeworkAddLocked ? (
                    'Đã qua ngày'
                  ) : hwSaved ? (
                    <><Check size={16} /> Đã thêm!</>
                  ) : (
                    <><Plus size={16} /> {hwPending ? 'Đang lưu...' : 'Thêm'}</>
                  )}
                </KidButton>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {homeworkItems.map((item) => {
              const subject = getSubjectById(item.subjectId)
              const icon = ICON_MAP[item.iconKey] ?? ICON_MAP.book
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-white p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-700">
                      {icon?.emoji} {subject?.name ?? item.subjectId}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">{item.label}</p>
                  </div>
                  <div
                    className={cn(
                      'rounded-xl px-2.5 py-2 text-xs font-extrabold',
                      item.isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {item.isDone ? '✅ Hoàn thành' : '🕒 Chưa xong'}
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-700">
                    +{item.points}
                  </div>
                  {!homeworkAddLocked && (
                    <button
                      onClick={() => handleDeleteHomework(item.id)}
                      aria-label="Xóa bài tập"
                      className="flex min-h-10 min-w-10 items-center justify-center rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )
            })}
            {homeworkItems.length === 0 ? (
              <p className="py-6 text-center text-sm font-bold text-slate-400">
                Chưa có bài tập cho {DAY_LABELS[homeworkDay]}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
