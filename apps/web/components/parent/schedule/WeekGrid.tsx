'use client'

/**
 * Week grid — step 2 of entering a timetable.
 *
 * The parent sees the same shape as the sheet in their hand: tiết down the
 * side, weekdays across the top. Tapping a cell picks a subject; times are
 * never asked for, because the bell schedule already knows them. One save
 * writes the whole week in a single transaction.
 *
 * Replaces a per-period form that cost ~140 interactions and 35 serial
 * round-trips for a full timetable. See docs/SCHEDULE_PARENT_IMP.md §6.1.
 */

import { useCallback, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Copy, Trash2 } from 'lucide-react'
import { SUBJECTS, getSubjectById, type BellSlot, type DailySchedule, type DayOfWeek, type WeekCell } from '@kid-hub/shared'

import { saveWeeklyScheduleAction } from '@/server/actions/schedule.actions'
import { SCHOOL_DAYS, DAY_LABELS } from '@/lib/constants'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

type CellValue = { subjectId: string; note?: string }
type CellMap = Record<string, CellValue>

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
  initialSchedule,
  bellSlots,
  readOnly = false,
  onSaved,
}: {
  initialSchedule: DailySchedule[]
  bellSlots: BellSlot[]
  readOnly?: boolean
  onSaved?: () => void
}) {
  const rows = useMemo(() => periodRows(bellSlots), [bellSlots])
  const [cells, setCells] = useState<CellMap>(() => buildCells(initialSchedule))
  // Advanced only by this component's own save. Nothing else writes school
  // periods any more, so there is no external change to resync from.
  const [baseline, setBaseline] = useState<string>(() => JSON.stringify(buildCells(initialSchedule)))
  const [selected, setSelected] = useState<{ day: DayOfWeek; periodNumber: number } | null>(null)
  const [copyFrom, setCopyFrom] = useState<DayOfWeek>('monday')
  const [copyTo, setCopyTo] = useState<DayOfWeek>('thursday')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isDirty = JSON.stringify(cells) !== baseline

  const setCell = useCallback((day: DayOfWeek, periodNumber: number, value: CellValue | null) => {
    setCells((prev) => {
      const next = { ...prev }
      if (value == null) delete next[key(day, periodNumber)]
      else next[key(day, periodNumber)] = value
      return next
    })
  }, [])

  const handleCopyDay = () => {
    if (copyFrom === copyTo) return
    setCells((prev) => {
      const next = { ...prev }
      for (const row of rows) {
        const source = prev[key(copyFrom, row.periodNumber)]
        if (source) next[key(copyTo, row.periodNumber)] = { ...source }
        else delete next[key(copyTo, row.periodNumber)]
      }
      return next
    })
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await saveWeeklyScheduleAction({ cells: toPayload(cells) })
      if (!result.success) {
        setError(result.error ?? 'Không lưu được thời khóa biểu')
        return
      }
      setBaseline(JSON.stringify(cells))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error ? (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <AlertCircle size={16} /> {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-20 text-left text-[11px] font-extrabold tracking-wide text-slate-400 uppercase">
                Tiết
              </th>
              {SCHOOL_DAYS.map((day) => (
                <th
                  key={day}
                  className="text-center text-[11px] font-extrabold tracking-wide text-slate-500 uppercase"
                >
                  {DAY_LABELS[day].replace('Thứ ', 'T.')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const startsAfternoon = row.session === 'afternoon' && rows[i - 1]?.session === 'morning'
              return (
                <>
                  {i === 0 || startsAfternoon ? (
                    <tr key={`band-${row.session}`}>
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
                  <tr key={row.periodNumber}>
                    <td className="align-middle">
                      <div className="text-xs font-black text-slate-600">Tiết {row.periodNumber}</div>
                      <div className="text-[10px] font-bold text-slate-400">{row.startTime}</div>
                    </td>
                    {SCHOOL_DAYS.map((day) => {
                      const value = cells[key(day, row.periodNumber)]
                      const subject = value ? getSubjectById(value.subjectId) : undefined
                      const isSelected =
                        selected?.day === day && selected.periodNumber === row.periodNumber
                      return (
                        <td key={day} className="p-0">
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => setSelected({ day, periodNumber: row.periodNumber })}
                            className={cn(
                              'flex h-full min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1.5 py-1.5 text-center transition-colors',
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
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && !readOnly ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50/70 p-3">
          <span className="text-xs font-black text-slate-500">
            {DAY_LABELS[selected.day]} · Tiết {selected.periodNumber}
          </span>
          <select
            value={selectedValue?.subjectId ?? ''}
            onChange={(e) =>
              setCell(
                selected.day,
                selected.periodNumber,
                e.target.value
                  ? { subjectId: e.target.value, ...(selectedValue?.note ? { note: selectedValue.note } : {}) }
                  : null
              )
            }
            className="min-w-[150px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="">— Trống —</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
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
            placeholder="Học vần, Tập viết..."
            aria-label="Nội dung tiết học"
            className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none disabled:bg-slate-100"
          />
          {selectedValue ? (
            <button
              type="button"
              onClick={() => setCell(selected.day, selected.periodNumber, null)}
              aria-label="Xóa tiết học"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>
          ) : null}
        </div>
      ) : null}

      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl bg-slate-50/70 px-3 py-2">
            <Copy size={14} className="text-slate-400" />
            <select
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value as DayOfWeek)}
              aria-label="Sao chép từ ngày"
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700"
            >
              {SCHOOL_DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
            </select>
            <span className="text-xs font-bold text-slate-400">→</span>
            <select
              value={copyTo}
              onChange={(e) => setCopyTo(e.target.value as DayOfWeek)}
              aria-label="Sao chép sang ngày"
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700"
            >
              {SCHOOL_DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
            </select>
            <button
              type="button"
              onClick={handleCopyDay}
              disabled={copyFrom === copyTo}
              className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-black text-slate-600 disabled:opacity-50"
            >
              Sao chép
            </button>
          </div>

          <KidButton
            variant="primary"
            onClick={handleSave}
            isDisabled={isPending || !isDirty}
            className="ml-auto min-h-11 gap-1.5 px-5"
          >
            {saved ? (
              <><Check size={16} /> Đã lưu!</>
            ) : (
              isPending ? 'Đang lưu...' : 'Lưu cả tuần'
            )}
          </KidButton>
        </div>
      ) : null}
    </div>
  )
}
