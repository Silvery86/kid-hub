'use client'

/**
 * Week grid — step 2 of entering a timetable.
 *
 * The parent sees the same shape as the sheet in their hand: tiết down the
 * side, weekdays across the top. Tapping a cell picks a subject; times are
 * never asked for, because the bell schedule already knows them. One save
 * writes the whole week in a single transaction.
 *
 * Since Phase 6 the grid is about ONE dated week, not a template that governs
 * every week. Three states follow from that (docs/SCHEDULE_PARENT_IMP.md §12):
 *
 *  - `own`       — this week has its own rows; edits touch only this week
 *  - `inherited` — no rows yet, so an earlier week's are shown; saving
 *                  materialises this week and the inheritance stops here
 *  - past        — the week has finished; it is a record, so nothing is editable
 *
 * Replaces a per-period form that cost ~140 interactions and 35 serial
 * round-trips for a full timetable. See §6.1.
 */

import { Fragment, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, BookMarked, CalendarOff, Check, Clock, CopyPlus, History, Lock, Trash2 } from 'lucide-react'
import {
  FEEDBACK,
  addWeeks,
  resolveSubject,
  isPastWeek,
  semesterEndIso,
  weekStartOfToday,
  weekStartsBetween,
  breaksInWeek,
  dateOfWeekday,
  isPeriodClosed,
  isWholeWeekOff,
  nowInSchoolZone,
  subjectGroupsForPicker,
  variantsFor,
  type CustomSubjectRow,
  type BellSlot,
  type DailySchedule,
  type DayOfWeek,
  type SchoolBreak,
  type WeekCell,
  type WeekSource,
} from '@kid-hub/shared'

import { toast } from '@/hooks/useToast'
import { useFlash } from '@/hooks/animation'
import { Spinner } from '@/components/ui/Spinner'

import {
  copyWeekAction,
  getWeekScheduleAction,
  previewCopyWeekAction,
  saveWeeklyScheduleAction,
} from '@/server/actions/schedule.actions'
import { SCHOOL_DAYS, DAY_LABELS } from '@/lib/constants'
import { FullScreenModal } from '@/components/ui/FullScreenModal'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

type CellValue = { subjectId: string; note?: string }
type CellMap = Record<string, CellValue>
type CopyScope = 'next' | 'semester'

const key = (day: DayOfWeek, periodNumber: number): string => `${day}-${periodNumber}`

const buildCells = (schedule: DailySchedule[]): CellMap => {
  const cells: CellMap = {}
  for (const daySchedule of schedule) {
    for (const period of daySchedule.periods) {
      if (period.periodNumber == null) continue
      if (period.eventType != null && period.eventType !== 'SCHOOL_PERIOD') continue
      cells[key(daySchedule.day, period.periodNumber)] = {
        subjectId: period.subjectId,
        ...(period.note ? { note: period.note } : {}),
      }
    }
  }
  return cells
}

const toPayload = (cells: CellMap): WeekCell[] =>
  Object.entries(cells).flatMap(([k, value]) => {
    const dash = k.lastIndexOf('-')
    const day = k.slice(0, dash) as DayOfWeek
    const periodNumber = Number(k.slice(dash + 1))
    if (!value.subjectId) return []
    return [{ day, periodNumber, subjectId: value.subjectId, ...(value.note ? { note: value.note } : {}) }]
  })

/** "2026-09-14" → "14/09" — the form the rest of the parent screen uses. */
const shortDate = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** Rows of the grid, in printed-sheet order, with the session they belong to. */
interface PeriodRow {
  periodNumber: number
  startTime: string
  endTime: string
  session: 'morning' | 'afternoon'
}

const periodRows = (slots: BellSlot[]): PeriodRow[] =>
  slots
    .filter((s) => s.kind === 'PERIOD' && s.periodNumber != null)
    .map((s) => ({
      periodNumber: s.periodNumber!,
      startTime: s.startTime,
      endTime: s.endTime,
      // The printed sheet splits BUỔI SÁNG from BUỔI CHIỀU; midday is the split.
      session: (s.startTime < '12:00' ? 'morning' : 'afternoon') as PeriodRow['session'],
    }))
    .sort((a, b) => a.periodNumber - b.periodNumber)

export function WeekGrid({
  weekStartDate,
  initialSchedule,
  initialSource = 'own',
  initialInheritedFrom,
  bellSlots,
  breaks = [],
  readOnly = false,
  onSaved,
  gradeLevel,
  rememberedVariants = {},
  customSubjects = [],
}: {
  /** The Monday this grid is showing. */
  weekStartDate: string
  initialSchedule: DailySchedule[]
  /** Whether `initialSchedule` is this week's own data or an earlier week's. */
  initialSource?: WeekSource
  initialInheritedFrom?: string
  bellSlots: BellSlot[]
  /** Holidays and nghỉ hè, so the grid can say which days are not taught. */
  breaks?: SchoolBreak[]
  readOnly?: boolean
  onSaved?: () => void
  /** Decides which subjects the picker offers. 0 falls back to the catalogue. */
  gradeLevel: number
  /** Lesson variants this household has already typed, keyed by subject. */
  rememberedVariants?: Record<string, string[]>
  /** Subjects this school teaches that the programme does not name. */
  customSubjects?: CustomSubjectRow[]
}) {
  const rows = useMemo(() => periodRows(bellSlots), [bellSlots])

  const [cells, setCells] = useState<CellMap>(() => buildCells(initialSchedule))
  // Subjects the grade teaches, plus any this week already uses. The second half
  // is what stops a <select> rendering blank: a lớp 3 week full of TNXH keeps
  // showing TNXH after the child moves up to lớp 4, because the option is still
  // there to match the value.
  const subjectGroups = useMemo(
    () =>
      subjectGroupsForPicker(
        gradeLevel,
        [...new Set(Object.values(cells).map((c) => c.subjectId))],
        customSubjects
      ),
    [gradeLevel, cells, customSubjects]
  )
  const [baseline, setBaseline] = useState<string>(() => JSON.stringify(buildCells(initialSchedule)))
  // Keyed on the baseline: it only moves when a save has actually landed, so the
  // grid confirms in place rather than leaving the toast to do it alone. Never
  // fires on first render — arriving on a week is not a change.
  const justSaved = useFlash(baseline)
  const [source, setSource] = useState<WeekSource>(initialSource)
  const [inheritedFrom, setInheritedFrom] = useState<string | undefined>(initialInheritedFrom)
  const [loadedWeek, setLoadedWeek] = useState(weekStartDate)
  const [selected, setSelected] = useState<{ day: DayOfWeek; periodNumber: number } | null>(null)
  const [copyScope, setCopyScope] = useState<CopyScope | null>(null)
  const [copyPreview, setCopyPreview] = useState<
    { total: number; occupied: number; onBreak: number } | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  // The week the parent is actually in, so "past" survives the tab being left
  // open across midnight on a Sunday.
  const currentWeek = useMemo(() => weekStartOfToday(), [])
  const isPast = isPastWeek(weekStartDate, currentWeek)
  const locked = readOnly || isPast

  // The classroom clock, not the device's and not the server's. Null until
  // mounted so the server-rendered HTML and the first client render agree;
  // nothing is time-locked for that one frame, which costs nothing because
  // editing needs the client anyway.
  const [now, setNow] = useState<{ dateIso: string; minutes: number } | null>(null)
  useEffect(() => {
    const tick = () => setNow(nowInSchoolZone())
    tick()
    // A parent can sit on this screen through a lesson boundary.
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  /**
   * A cell is closed if its whole day has passed, or — today — if its lesson
   * started more than the grace window ago.
   */
  const cellIsClosed = useCallback(
    (day: DayOfWeek, startTime: string) => {
      if (locked) return true
      if (!now) return false
      return isPeriodClosed(dateOfWeekday(weekStartDate, day), startTime, now.dateIso, now.minutes)
    },
    [locked, weekStartDate, now]
  )

  /** A whole column is closed only when every one of its lessons is. */
  const dayIsClosed = useCallback(
    (day: DayOfWeek) =>
      locked || (rows.length > 0 && rows.every((r) => cellIsClosed(day, r.startTime))),
    [locked, rows, cellIsClosed]
  )
  const isDirty = JSON.stringify(cells) !== baseline
  const weekBreaks = useMemo(() => breaksInWeek(breaks, weekStartDate), [breaks, weekStartDate])
  const wholeWeekOff = useMemo(() => isWholeWeekOff(breaks, weekStartDate), [breaks, weekStartDate])

  // Paging to another week replaces the whole grid, so the fetch belongs here
  // rather than in the page: the parent stays on the same screen throughout.
  useEffect(() => {
    if (weekStartDate === loadedWeek) return
    let cancelled = false
    void (async () => {
      const result = await getWeekScheduleAction(weekStartDate)
      if (cancelled) return
      if (!result.success) {
        setError(result.error ?? 'Không tải được thời khóa biểu tuần này')
        return
      }
      const next = buildCells(result.data.days)
      setError(null)
      setCells(next)
      setBaseline(JSON.stringify(next))
      setSource(result.data.source)
      setInheritedFrom(result.data.inheritedFrom)
      setLoadedWeek(weekStartDate)
    })()
    return () => {
      cancelled = true
    }
  }, [weekStartDate, loadedWeek])

  const setCell = useCallback((day: DayOfWeek, periodNumber: number, value: CellValue | null) => {
    setCells((prev) => {
      const next = { ...prev }
      if (value == null) delete next[key(day, periodNumber)]
      else next[key(day, periodNumber)] = value
      return next
    })
  }, [])

  /**
   * `week` writes a one-off; `forward` makes this the standing timetable.
   *
   * Two buttons rather than a toggle: the difference is the whole term, and a
   * remembered switch is the kind of thing a parent discovers only afterwards.
   */
  const handleSave = (applyTo: 'week' | 'forward') => {
    setError(null)
    startTransition(async () => {
      const result = await saveWeeklyScheduleAction({
        weekStartDate,
        applyTo,
        cells: toPayload(cells),
      })
      if (!result.success) {
        // Stays inline on purpose: "tiết học đã bắt đầu" is about a cell the
        // parent is looking at, and means more beside the grid than floating
        // over it.
        setError(result.error ?? FEEDBACK.schedule.saveFailed)
        return
      }
      toast.success(
        applyTo === 'forward'
          ? FEEDBACK.schedule.savedForward(`tuần ${shortDate(weekStartDate)}`)
          : FEEDBACK.schedule.saved(`tuần ${shortDate(weekStartDate)}`)
      )
      setBaseline(JSON.stringify(cells))
      // The week now owns its rows — it no longer follows an earlier one.
      setSource('own')
      setInheritedFrom(undefined)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    })
  }

  const throughWeekFor = (scope: CopyScope): string =>
    scope === 'next' ? addWeeks(weekStartDate, 1) : semesterEndIso(weekStartDate)

  const openCopy = (scope: CopyScope) => {
    setCopyScope(scope)
    setCopyPreview(null)
    startTransition(async () => {
      const result = await previewCopyWeekAction({
        fromWeek: weekStartDate,
        throughWeek: throughWeekFor(scope),
      })
      if (!result.success) {
        setError(result.error ?? 'Không xem trước được')
        setCopyScope(null)
        return
      }
      setCopyPreview({
        total: result.data.targetWeeks.length,
        occupied: result.data.weeksWithOwnRows.length,
        onBreak: result.data.breakWeeks.length,
      })
    })
  }

  const runCopy = (overwrite: boolean) => {
    if (!copyScope) return
    const scope = copyScope
    startTransition(async () => {
      const result = await copyWeekAction({
        fromWeek: weekStartDate,
        throughWeek: throughWeekFor(scope),
        overwrite,
      })
      setCopyScope(null)
      setCopyPreview(null)
      if (!result.success) {
        setError(result.error ?? 'Không sao chép được')
        return
      }
      const { weeksWritten, weeksSkipped, weeksOnBreak } = result.data
      const detail: string[] = []
      if (weeksSkipped > 0) detail.push(`giữ nguyên ${weeksSkipped} tuần đã có thời khóa biểu riêng`)
      if (weeksOnBreak > 0) detail.push(`bỏ qua ${weeksOnBreak} tuần nghỉ`)
      toast.success({
        title: FEEDBACK.schedule.copied(weeksWritten),
        // What was skipped is the part a parent would otherwise discover weeks
        // later, so it travels with the confirmation rather than being dropped.
        description: detail.length > 0 ? `${detail.join(', ')}.` : undefined,
        duration: detail.length > 0 ? 7000 : undefined,
      })
      onSaved?.()
    })
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-bold text-slate-600">
          Chưa có khung giờ tiết học. Hãy thiết lập giờ từng tiết trước, sau đó chọn môn cho cả tuần.
        </p>
        <Link
          href="/parent/bell-schedule"
          className="rounded-full border-4 border-blue-800 bg-blue-500 px-5 py-2.5 text-sm font-black text-white"
        >
          Thiết lập khung giờ
        </Link>
      </div>
    )
  }

  const selectedValue = selected ? cells[key(selected.day, selected.periodNumber)] : undefined
  const selectedRow = selected ? rows.find((r) => r.periodNumber === selected.periodNumber) : undefined
  // Static suggestions plus whatever this household has typed before. A school
  // that words its lessons differently taught the app its words weeks ago; this
  // is where the app stops forgetting them.
  const suggestedVariants = selectedValue?.subjectId
    ? variantsFor(selectedValue.subjectId, rememberedVariants)
    : []
  const semesterWeeks = weekStartsBetween(weekStartDate, semesterEndIso(weekStartDate)).length

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error ? (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <AlertCircle size={16} /> {error}
        </div>
      ) : null}


      {/* A break does not delete the week's timetable — it says it is not
          taught. The rows stay editable so next year's copy still has them. */}
      {weekBreaks.length > 0 ? (
        <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-700">
          <CalendarOff size={14} className="mt-0.5 shrink-0" />
          <span>
            {wholeWeekOff ? 'Cả tuần nghỉ' : 'Trong tuần có ngày nghỉ'}:{' '}
            {weekBreaks.map((b) => b.label).join(' · ')}
          </span>
        </div>
      ) : null}

      {/* Provenance, stated rather than implied: an inherited week and an own
          week look identical on screen but behave differently on save. */}
      {isPast ? (
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-extrabold text-slate-600">
          <Lock size={14} /> Tuần {shortDate(weekStartDate)} đã qua — chỉ xem lại, không sửa được
        </div>
      ) : source === 'inherited' && inheritedFrom ? (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-700">
          <History size={14} /> Đang dùng thời khóa biểu tuần {shortDate(inheritedFrom)}. Sửa và lưu
          để tuần này có thời khóa biểu riêng.
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-1">
        <Link
          href="/parent/subjects"
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <BookMarked size={14} /> Môn học
        </Link>
        <Link
          href="/parent/school-breaks"
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <CalendarOff size={14} /> Ngày nghỉ
        </Link>
        <Link
          href="/parent/bell-schedule"
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Clock size={14} /> Sửa khung giờ
        </Link>
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-auto rounded-row',
          justSaved && 'animate-flash'
        )}
      >
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-20 text-left text-[11px] font-extrabold tracking-wide text-slate-400 uppercase">
                Tiết
              </th>
              {SCHOOL_DAYS.map((day) => {
                const dayDate = dateOfWeekday(weekStartDate, day)
                return (
                  <th
                    key={day}
                    className={cn(
                      'text-center text-[11px] font-extrabold tracking-wide uppercase',
                      dayDate === now?.dateIso
                        ? 'text-blue-600'
                        : dayIsClosed(day)
                          ? 'text-slate-300'
                          : 'text-slate-500'
                    )}
                  >
                    {DAY_LABELS[day].replace('Thứ ', 'T.')}
                    <span className="block text-[9px] font-bold">{shortDate(dayDate)}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const startsAfternoon = row.session === 'afternoon' && rows[i - 1]?.session === 'morning'
              return (
                <Fragment key={row.periodNumber}>
                  {i === 0 || startsAfternoon ? (
                    <tr>
                      <td
                        colSpan={SCHOOL_DAYS.length + 1}
                        className={cn(
                          'rounded-lg px-2 py-1 text-[11px] font-black tracking-wide uppercase',
                          row.session === 'morning'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-rose-100 text-rose-700'
                        )}
                      >
                        {row.session === 'morning' ? '☀️ Buổi sáng' : '🌤️ Buổi chiều'}
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td className="align-middle">
                      <div className="text-xs font-black text-slate-600">Tiết {row.periodNumber}</div>
                      <div className="text-[10px] font-bold text-slate-400">{row.startTime}</div>
                    </td>
                    {SCHOOL_DAYS.map((day) => {
                      const value = cells[key(day, row.periodNumber)]
                      const subject = value ? resolveSubject(value.subjectId, customSubjects) : undefined
                      const isSelected =
                        selected?.day === day && selected.periodNumber === row.periodNumber
                      const closed = cellIsClosed(day, row.startTime)
                      return (
                        <td key={day} className="p-0">
                          <button
                            type="button"
                            disabled={closed}
                            title={
                              closed && !locked
                                ? 'Tiết này đã bắt đầu — không sửa được nữa'
                                : undefined
                            }
                            onClick={() => setSelected({ day, periodNumber: row.periodNumber })}
                            className={cn(
                              'flex h-full min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1.5 py-1.5 text-center transition-colors',
                              // Past days read as finished rather than broken:
                              // faded, but the lesson stays legible.
                              closed && !locked ? 'opacity-45' : '',
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : subject
                                  ? 'border-transparent'
                                  : 'border-dashed border-slate-200 bg-slate-50'
                            )}
                            style={
                              subject && !isSelected
                                ? { background: `color-mix(in oklab, ${subject.color} 14%, white)`, color: subject.color }
                                : undefined
                            }
                          >
                            {subject ? (
                              <>
                                <span className="w-full truncate text-[11px] font-black leading-tight">
                                  {subject.name}
                                </span>
                                {value?.note ? (
                                  <span className="w-full truncate text-[10px] font-bold opacity-75">
                                    {value.note}
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-xs font-bold text-slate-300">+</span>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Editing happens in a dialog: the grid is tall, and an editor below it
          meant selecting a cell then scrolling away from the cell to fill it. */}
      <FullScreenModal
        isOpen={
          Boolean(selected) &&
          !!selected &&
          !cellIsClosed(selected.day, selectedRow?.startTime ?? '00:00')
        }
        hasCloseButton={false}
        className="flex h-full w-full items-center justify-center p-4"
      >
        {selected ? (
          <div className="w-full max-w-sm rounded-[26px] bg-white p-5 shadow-2xl">
            <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
              {DAY_LABELS[selected.day]}
            </p>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              <h2 className="text-xl font-black text-slate-800">Tiết {selected.periodNumber}</h2>
              {selectedRow ? (
                <span className="text-xs font-bold text-slate-400">
                  {selectedRow.startTime} – {selectedRow.endTime}
                </span>
              ) : null}
            </div>

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                Môn học
              </span>
              <select
                autoFocus
                value={selectedValue?.subjectId ?? ''}
                onChange={(e) => {
                  const subjectId = e.target.value
                  if (!subjectId) {
                    setCell(selected.day, selected.periodNumber, null)
                    return
                  }
                  // The variant belongs to the subject, not to the slot.
                  // "Học vần" describes a Tiếng Việt lesson; carrying it across
                  // to Đạo đức produced "Đạo đức — Học vần", which is nonsense.
                  const keepNote =
                    subjectId === selectedValue?.subjectId && selectedValue.note
                      ? { note: selectedValue.note }
                      : {}
                  setCell(selected.day, selected.periodNumber, { subjectId, ...keepNote })
                }}
                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                <option value="">— Trống —</option>
                {subjectGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                Nội dung (không bắt buộc)
              </span>
              {/* Offered, not enforced — D1 kept this field free text so a school
                  that words things differently is not locked out. The list is
                  scoped to the subject so Đạo đức is never offered "Học vần". */}
              {selectedValue?.subjectId && suggestedVariants.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {suggestedVariants.map((variant) => {
                    const active = selectedValue.note === variant
                    return (
                      <button
                        key={variant}
                        type="button"
                        onClick={() =>
                          setCell(selected.day, selected.periodNumber, {
                            subjectId: selectedValue.subjectId,
                            ...(active ? {} : { note: variant }),
                          })
                        }
                        className={cn(
                          'rounded-full border-2 px-3 py-1.5 text-xs font-black',
                          active
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {variant}
                      </button>
                    )
                  })}
                </div>
              ) : null}
              <input
                type="text"
                maxLength={40}
                value={selectedValue?.note ?? ''}
                disabled={!selectedValue?.subjectId}
                onChange={(e) =>
                  selectedValue?.subjectId
                    ? setCell(selected.day, selected.periodNumber, {
                        subjectId: selectedValue.subjectId,
                        note: e.target.value,
                      })
                    : undefined
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelected(null)
                }}
                placeholder="Học vần, Tập viết..."
                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none disabled:bg-slate-100"
              />
            </label>

            <div className="mt-5 flex items-center gap-2">
              {selectedValue ? (
                <button
                  type="button"
                  onClick={() => {
                    setCell(selected.day, selected.periodNumber, null)
                    setSelected(null)
                  }}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-black text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={16} /> Xóa tiết
                </button>
              ) : null}
              <KidButton
                variant="primary"
                onClick={() => setSelected(null)}
                className="ml-auto min-h-11 px-6"
              >
                Xong
              </KidButton>
            </div>
          </div>
        ) : null}
      </FullScreenModal>

      {/* Copying is the one destructive thing here, so the count of weeks it
          would overwrite is shown before it runs, never after. */}
      <FullScreenModal
        isOpen={copyScope !== null}
        hasCloseButton={false}
        className="flex h-full w-full items-center justify-center p-4"
      >
        <div className="w-full max-w-sm rounded-[26px] bg-white p-5 shadow-2xl">
          <h2 className="text-lg font-black text-slate-800">Sao chép cả tuần</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {copyScope === 'next'
              ? `Chép thời khóa biểu tuần ${shortDate(weekStartDate)} sang tuần kế tiếp.`
              : `Chép thời khóa biểu tuần ${shortDate(weekStartDate)} sang tất cả các tuần còn lại của học kỳ, đến ${shortDate(semesterEndIso(weekStartDate))}.`}
          </p>

          {copyPreview ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">
              <p>
                Sẽ ghi vào <strong className="text-slate-800">{copyPreview.total}</strong> tuần.
              </p>
              {copyPreview.occupied > 0 ? (
                <p className="mt-1 text-amber-700">
                  Trong đó <strong>{copyPreview.occupied}</strong> tuần đã có thời khóa biểu riêng —
                  chép đè sẽ mất nội dung đã sửa của các tuần đó.
                </p>
              ) : null}
              {copyPreview.onBreak > 0 ? (
                <p className="mt-1 text-rose-700">
                  Bỏ qua <strong>{copyPreview.onBreak}</strong> tuần nghỉ lễ / nghỉ hè.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm font-bold text-slate-400">Đang kiểm tra...</p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCopyScope(null)
                setCopyPreview(null)
              }}
              className="min-h-11 rounded-xl px-4 text-xs font-black text-slate-500 hover:bg-slate-100"
            >
              Hủy
            </button>
            {copyPreview && copyPreview.occupied > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => runCopy(false)}
                  disabled={isPending}
                  className="min-h-11 rounded-xl bg-slate-200 px-4 text-xs font-black text-slate-700 disabled:opacity-50"
                >
                  Giữ nguyên các tuần đó
                </button>
                <button
                  type="button"
                  onClick={() => runCopy(true)}
                  disabled={isPending}
                  className="min-h-11 rounded-xl bg-red-500 px-4 text-xs font-black text-white disabled:opacity-50"
                >
                  Chép đè tất cả
                </button>
              </>
            ) : (
              <KidButton
                variant="primary"
                onClick={() => runCopy(false)}
                isDisabled={isPending || !copyPreview || copyPreview.total === 0}
                className="min-h-11 px-5"
              >
                Sao chép
              </KidButton>
            )}
          </div>
        </div>
      </FullScreenModal>

      {!locked ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCopy('next')}
            disabled={isDirty || source === 'empty'}
            title={isDirty ? 'Hãy lưu tuần này trước khi sao chép' : undefined}
            className="flex min-h-11 items-center gap-1.5 rounded-2xl bg-slate-100 px-3 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:opacity-40"
          >
            <CopyPlus size={14} /> Sang tuần sau
          </button>
          <button
            type="button"
            onClick={() => openCopy('semester')}
            disabled={isDirty || source === 'empty' || semesterWeeks === 0}
            title={isDirty ? 'Hãy lưu tuần này trước khi sao chép' : undefined}
            className="flex min-h-11 items-center gap-1.5 rounded-2xl bg-slate-100 px-3 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:opacity-40"
          >
            <CopyPlus size={14} /> Đến hết học kỳ
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('forward')}
              disabled={isPending || !isDirty}
              title="Dùng làm thời khóa biểu chuẩn cho tuần này và các tuần sau"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border-2 border-slate-200 px-4 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {isPending ? <Spinner size={12} /> : null} Áp dụng từ tuần này trở đi
            </button>
            <KidButton
              variant="primary"
              onClick={() => handleSave('week')}
              isDisabled={isPending || !isDirty}
              className="min-h-11 gap-1.5 px-5"
            >
              {saved ? (
                <><Check size={16} /> Đã lưu!</>
              ) : (
                isPending ? 'Đang lưu...' : 'Chỉ lưu tuần này'
              )}
            </KidButton>
          </div>
        </div>
      ) : null}
    </div>
  )
}
