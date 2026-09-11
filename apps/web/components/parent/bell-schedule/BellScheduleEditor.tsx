'use client'

/**
 * Bell schedule editor — step 1 of entering a timetable.
 *
 * Schools publish rules, not tables of times ("8h10 vào tiết 1, mỗi tiết 35',
 * 9h30 ra chơi"). So this screen asks for the rules in that shape and derives
 * the timeline. A parent enters eight numbers instead of transcribing fourteen
 * and hoping the arithmetic held.
 *
 * Two of those numbers are not periods at all. Bán trú decides whether the
 * midday hours are spent at school, and the routines carry the per-day
 * variation — Mon–Thu have a guided hour, Friday does not, which is the only
 * reason the week is uneven. Without both, no household whose Friday ends
 * early can describe its own school.
 *
 * The times the school states as results — tan học buổi sáng, giờ tan học —
 * are computed and shown back, never asked for. An earlier version asked the
 * parent to type them in so it could flag a mismatch; it checked the one time
 * that only matters for non-boarding families, ignored the per-day dismissal
 * that matters for everyone, and could not be acted on when it did fire.
 *
 * See docs/SCHEDULE_PARENT_IMP.md §6.
 */

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Check, Plus, Trash2 } from 'lucide-react'
import {
  FEEDBACK,
  BELL_PRESETS,
  dayShortLabel,
  findRuleIssues,
  generateSlots,
  groupDismissals,
  morningEnd,
  presetForGrade,
  type BellRoutine,
  type BellRules,
  type BellSlot,
  type DayOfWeek,
} from '@kid-hub/shared'

import { saveBellScheduleAction } from '@/server/actions/schedule.actions'
import { toast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

const SLOT_STYLE: Record<BellSlot['kind'], { row: string; chip: string }> = {
  PERIOD: { row: 'bg-white', chip: 'bg-blue-100 text-blue-700' },
  BREAK: { row: 'bg-amber-50/60', chip: 'bg-amber-100 text-amber-700' },
  ROUTINE: { row: 'bg-slate-50', chip: 'bg-slate-200 text-slate-600' },
}

const WEEK_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

/** What the database holds right now — what a revert restores to. */
interface StoredSchedule {
  rules: BellRules
  presetKey: string | undefined
}

const numberInput =
  'w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none'
const timeInput =
  'w-28 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      {children}
    </label>
  )
}

export function BellScheduleEditor({
  gradeLevel,
  initialRules,
  initialPresetKey,
}: {
  gradeLevel: number
  initialRules?: BellRules | null
  initialPresetKey?: string
}) {
  // D seeds B: the grade picks a starting point, the parent corrects it.
  const seed = useMemo(() => presetForGrade(gradeLevel), [gradeLevel])
  const [presetKey, setPresetKey] = useState(initialPresetKey ?? seed.key)
  const [rules, setRules] = useState<BellRules>(initialRules ?? seed.rules)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [stored, setStored] = useState<StoredSchedule | null>(
    initialRules ? { rules: initialRules, presetKey: initialPresetKey } : null
  )

  const issues = useMemo(() => findRuleIssues(rules), [rules])
  const slots = useMemo(() => (issues.length === 0 ? generateSlots(rules) : []), [rules, issues])
  const dismissals = useMemo(() => groupDismissals(slots), [slots])
  const pickup = useMemo(() => morningEnd(slots, rules), [slots, rules])

  const applyPreset = (key: string) => {
    const preset = BELL_PRESETS.find((p) => p.key === key)
    if (!preset) return
    setSaved(false)
    setPresetKey(key)
    setRules(preset.rules)
  }

  const patchMorning = (patch: Partial<BellRules['morning']>) => {
    setSaved(false)
    setRules((r) => ({ ...r, morning: { ...r.morning, ...patch } }))
  }

  const patchAfternoon = (patch: Partial<NonNullable<BellRules['afternoon']>>) => {
    setSaved(false)
    setRules((r) => (r.afternoon ? { ...r, afternoon: { ...r.afternoon, ...patch } } : r))
  }

  const patchRoutines = (next: BellRoutine[]) => {
    setSaved(false)
    setRules((r) => ({ ...r, routines: next }))
  }

  const patchRoutine = (index: number, patch: Partial<BellRoutine>) =>
    patchRoutines(rules.routines.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  // Days are rebuilt in weekday order rather than pushed, so a routine reads
  // "T2 T3 T5" however the parent clicked them.
  const toggleRoutineDay = (index: number, day: DayOfWeek) => {
    const current = rules.routines[index]!.days
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : WEEK_DAYS.filter((d) => d === day || current.includes(d))
    patchRoutine(index, { days: next })
  }

  const addRoutine = () =>
    patchRoutines([
      ...rules.routines,
      { label: '', startTime: '16:00', endTime: '17:00', days: WEEK_DAYS },
    ])

  const runSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await saveBellScheduleAction({ presetKey, rules })
      // Closed either way: the failure below renders inline, behind where this
      // dialog would otherwise still be sitting.
      setIsConfirming(false)
      if (!result.success) {
        // Inline: a bell-rule error points at a specific row of the editor.
        setError(result.error ?? FEEDBACK.bellSchedule.saveFailed)
        return
      }
      // The new baseline. A later revert has to restore what is now in the
      // database, not what the page happened to load with.
      setStored({ rules, presetKey })
      // Deliberately not cleared on a timer: this is step 1 of two, and the
      // link to step 2 has to stay put long enough to be read and clicked.
      toast.success(FEEDBACK.bellSchedule.saved)
      setSaved(true)
    })
  }

  /**
   * The first save writes a timetable where there was none — nothing to lose,
   * nothing to ask. Every save after that REPLACES one the household is already
   * using, and the consequence is not visible from this screen: weeks that have
   * already been filled in keep the times they were written with until each is
   * saved again. That is worth a question.
   */
  const handleSave = () => {
    if (issues.length > 0) return
    if (stored) setIsConfirming(true)
    else runSave()
  }

  const revertToStored = () => {
    if (!stored) return
    setIsConfirming(false)
    setError(null)
    setRules(stored.rules)
    setPresetKey(stored.presetKey ?? seed.key)
    toast.info(FEEDBACK.bellSchedule.reverted)
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-black text-slate-800 md:text-2xl">Khung giờ tiết học</h1>
        <p className="mt-1 text-sm font-bold text-slate-500">
          Nhập theo thông báo của trường. Giờ từng tiết sẽ được tính tự động.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Rules ── */}
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Field label="Mẫu theo cấp học">
              <select
                value={presetKey}
                onChange={(e) => applyPreset(e.target.value)}
                className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                {BELL_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </Field>
            <p className="text-xs font-bold text-slate-400">
              Đây chỉ là điểm bắt đầu — hãy sửa theo đúng quy định trường của bé.
            </p>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-black tracking-wide text-slate-500 uppercase">Chung</h2>
            <Field label="Mỗi tiết (phút)">
              <input
                type="number" min={5} max={120} className={numberInput}
                value={rules.periodMinutes}
                onChange={(e) => {
                  setSaved(false)
                  setRules((r) => ({ ...r, periodMinutes: Number(e.target.value) }))
                }}
              />
            </Field>
            <Field label="Nghỉ chuyển tiết (phút)">
              <input
                type="number" min={0} max={60} className={numberInput}
                value={rules.transitionMinutes}
                onChange={(e) => {
                  setSaved(false)
                  setRules((r) => ({ ...r, transitionMinutes: Number(e.target.value) }))
                }}
              />
            </Field>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-black tracking-wide text-slate-500 uppercase">Buổi sáng</h2>
            <Field label="Vào tiết 1">
              <input
                type="time" className={timeInput}
                value={rules.morning.start}
                onChange={(e) => patchMorning({ start: e.target.value })}
              />
            </Field>
            <Field label="Số tiết">
              <input
                type="number" min={0} max={12} className={numberInput}
                value={rules.morning.periods}
                onChange={(e) => patchMorning({ periods: Number(e.target.value) })}
              />
            </Field>
            {rules.morning.recess ? (
              <>
                <Field label="Ra chơi lúc">
                  <input
                    type="time" className={timeInput}
                    value={rules.morning.recess.start}
                    onChange={(e) =>
                      patchMorning({ recess: { ...rules.morning.recess!, start: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Ra chơi sau tiết">
                  <input
                    type="number" min={1} max={12} className={numberInput}
                    value={rules.morning.recess.afterPeriod}
                    onChange={(e) =>
                      patchMorning({
                        recess: { ...rules.morning.recess!, afterPeriod: Number(e.target.value) },
                      })
                    }
                  />
                </Field>
                <Field label="Ra chơi (phút)">
                  <input
                    type="number" min={1} max={120} className={numberInput}
                    value={rules.morning.recess.minutes}
                    onChange={(e) =>
                      patchMorning({
                        recess: { ...rules.morning.recess!, minutes: Number(e.target.value) },
                      })
                    }
                  />
                </Field>
              </>
            ) : null}
          </section>

          {rules.afternoon ? (
            <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-black tracking-wide text-slate-500 uppercase">Buổi chiều</h2>
              <Field label="Vào tiết đầu">
                <input
                  type="time" className={timeInput}
                  value={rules.afternoon.start}
                  onChange={(e) => patchAfternoon({ start: e.target.value })}
                />
              </Field>
              <Field label="Số tiết">
                <input
                  type="number" min={0} max={12} className={numberInput}
                  value={rules.afternoon.periods}
                  onChange={(e) => patchAfternoon({ periods: Number(e.target.value) })}
                />
              </Field>
              {rules.afternoon.recess ? (
                <>
                  <Field label="Ra chơi lúc">
                    <input
                      type="time" className={timeInput}
                      value={rules.afternoon.recess.start}
                      onChange={(e) =>
                        patchAfternoon({
                          recess: { ...rules.afternoon!.recess!, start: e.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="Ra chơi sau tiết">
                    <input
                      type="number" min={1} max={20} className={numberInput}
                      value={rules.afternoon.recess.afterPeriod}
                      onChange={(e) =>
                        patchAfternoon({
                          recess: {
                            ...rules.afternoon!.recess!,
                            afterPeriod: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </Field>
                </>
              ) : null}
            </section>
          ) : null}

          {/* Bán trú is a fact about the enrolment, not the school, so no preset
              can guess it — and it is the only question here the parent answers
              rather than copies. A morning-only school never asks it. */}
          {rules.afternoon ? (
            <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-black tracking-wide text-slate-500 uppercase">
                Buổi trưa
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {([true, false] as const).map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={rules.boarding === value}
                    onClick={() => {
                      setSaved(false)
                      setRules((r) => ({ ...r, boarding: value }))
                    }}
                    className={cn(
                      'min-h-12 rounded-xl border-2 px-3 py-2 text-sm font-black transition-colors',
                      rules.boarding === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    )}
                  >
                    {value ? 'Ở lại trường' : 'Về nhà buổi trưa'}
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-400">
                {rules.boarding
                  ? 'Bé ăn trưa và ngủ tại trường. Khung giờ sẽ tính luôn buổi trưa.'
                  : 'Bé về nhà sau buổi sáng và quay lại học buổi chiều.'}
              </p>
            </section>
          ) : null}

          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-black tracking-wide text-slate-500 uppercase">
              Hoạt động khác
            </h2>
            <p className="text-xs font-bold text-slate-400">
              Những giờ không phải tiết học: thể dục đầu giờ, hướng dẫn hoàn thành kiến thức… Chọn
              đúng các ngày có hoạt động — đó là lý do thứ Sáu tan học sớm hơn.
            </p>

            {rules.routines.map((routine, i) => (
              // Index key: a routine has no id, and the inputs are controlled, so
              // the right values still render after a delete.
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text" maxLength={40} placeholder="Tên hoạt động"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                    value={routine.label}
                    onChange={(e) => patchRoutine(i, { label: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={`Xoá ${routine.label || 'hoạt động'}`}
                    onClick={() => patchRoutines(rules.routines.filter((_, j) => j !== i))}
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="time" className={timeInput}
                    value={routine.startTime}
                    onChange={(e) => patchRoutine(i, { startTime: e.target.value })}
                  />
                  <span className="text-sm font-black text-slate-400">–</span>
                  <input
                    type="time" className={timeInput}
                    value={routine.endTime}
                    onChange={(e) => patchRoutine(i, { endTime: e.target.value })}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={routine.days.includes(day)}
                      onClick={() => toggleRoutineDay(i, day)}
                      className={cn(
                        'min-h-9 min-w-11 rounded-lg border-2 text-xs font-black transition-colors',
                        routine.days.includes(day)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-400'
                      )}
                    >
                      {dayShortLabel(day)}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addRoutine}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-black text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              <Plus size={16} /> Thêm hoạt động
            </button>
          </section>
        </div>

        {/* ── Preview ── */}
        <div className="flex flex-col gap-3">
          {/* The two numbers a parent actually plans around, derived from the
              rules. This is the cross-check against the school's notice: the
              app states what it computed, and a parent who sees the wrong time
              knows a rule above is wrong. */}
          {dismissals.length > 0 ? (
            <section className="flex flex-col gap-2 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
              <h2 className="text-sm font-black tracking-wide text-blue-500 uppercase">
                Giờ cần nhớ
              </h2>

              {!rules.boarding && pickup ? (
                <p className="text-sm font-bold text-blue-900">
                  Đón buổi trưa <span className="text-base font-black">{pickup}</span>
                  {rules.afternoon ? (
                    <>
                      {' · quay lại '}
                      <span className="text-base font-black">{rules.afternoon.start}</span>
                    </>
                  ) : null}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {dismissals.map((group) => (
                  <p key={`${group.days[0]}-${group.time}`} className="text-sm font-bold text-blue-900">
                    {'Tan học '}
                    {group.days.length > 1
                      ? `${dayShortLabel(group.days[0]!)}–${dayShortLabel(group.days[group.days.length - 1]!)}`
                      : dayShortLabel(group.days[0]!)}{' '}
                    <span className="text-base font-black">{group.time}</span>
                  </p>
                ))}
              </div>

              <p className="text-xs font-bold text-blue-400">
                So với thông báo của trường. Nếu lệch, sửa lại quy tắc ở bên trái.
              </p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-black tracking-wide text-slate-500 uppercase">
              Khung giờ tính ra
            </h2>

            {issues.length > 0 ? (
              <div className="flex flex-col gap-2">
                {issues.map((issue) => (
                  <div
                    key={issue.field}
                    className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-bold text-red-600"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" /> {issue.message}
                  </div>
                ))}
              </div>
            ) : (
              <ol className="flex flex-col gap-1.5">
                {slots.map((slot, i) => (
                  <li
                    key={`${slot.kind}-${slot.startTime}-${i}`}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2',
                      SLOT_STYLE[slot.kind].row
                    )}
                  >
                    <span
                      className={cn(
                        'grid min-w-14 place-items-center rounded-lg px-2 py-1 text-xs font-black',
                        SLOT_STYLE[slot.kind].chip
                      )}
                    >
                      {slot.kind === 'PERIOD' ? `Tiết ${slot.periodNumber}` : slot.kind === 'BREAK' ? 'Nghỉ' : '•'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
                      {slot.label ?? `Tiết ${slot.periodNumber}`}
                    </span>
                    {slot.days.length < 5 ? (
                      <span className="shrink-0 text-[11px] font-bold text-slate-400">
                        {slot.days.length} ngày
                      </span>
                    ) : null}
                    <span className="shrink-0 text-xs font-extrabold text-slate-500">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {error ? (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              <AlertCircle size={16} /> {error}
            </div>
          ) : null}

          {saved ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-emerald-700">
                <Check size={18} /> Đã lưu khung giờ
              </p>
              <p className="text-xs font-bold text-emerald-600">
                Bước tiếp theo: chọn môn học cho từng tiết trong tuần.
              </p>
              <Link
                href="/parent?view=schedule"
                className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-full border-4 border-blue-800 bg-blue-500 text-base font-black text-white shadow-lg shadow-blue-500/40"
              >
                Chọn môn cho cả tuần <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                onClick={() => setSaved(false)}
                className="text-xs font-bold text-emerald-700 underline"
              >
                Sửa lại khung giờ
              </button>
            </div>
          ) : (
            <KidButton
              variant="primary"
              onClick={handleSave}
              isDisabled={isPending || issues.length > 0}
              className="min-h-12 gap-2"
            >
              {isPending ? 'Đang lưu...' : 'Lưu khung giờ'}
            </KidButton>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirming}
        title="Thay đổi khung giờ đã lưu?"
        description={
          <>
            <p>Khung giờ đang dùng sẽ được thay bằng khung giờ vừa sửa.</p>
            <p className="mt-2">
              Những tuần đã xếp môn vẫn giữ giờ cũ cho đến khi bạn lưu lại từng tuần.
            </p>
          </>
        }
        confirmLabel="Lưu thay đổi"
        cancelLabel="Giữ khung giờ cũ"
        onConfirm={runSave}
        onCancel={revertToStored}
        onDismiss={() => setIsConfirming(false)}
        isPending={isPending}
      />
    </div>
  )
}
