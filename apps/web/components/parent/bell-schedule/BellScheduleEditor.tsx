'use client'

/**
 * Bell schedule editor — step 1 of entering a timetable.
 *
 * Schools publish rules, not tables of times ("8h10 vào tiết 1, mỗi tiết 35',
 * 9h30 ra chơi, 11h tan học buổi sáng"). So this screen asks for the rules in
 * that shape, derives the timeline, and checks the result against the clock
 * times the school also stated. A parent enters eight numbers instead of
 * transcribing fourteen and hoping the arithmetic held.
 *
 * See docs/SCHEDULE_PARENT_IMP.md §6.
 */

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Check } from 'lucide-react'
import {
  BELL_PRESETS,
  findRuleIssues,
  generateSlots,
  presetForGrade,
  validateAgainstAnchors,
  type BellAnchors,
  type BellRules,
  type BellSlot,
} from '@kid-hub/shared'

import { saveBellScheduleAction } from '@/server/actions/schedule.actions'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

const SLOT_STYLE: Record<BellSlot['kind'], { row: string; chip: string }> = {
  PERIOD: { row: 'bg-white', chip: 'bg-blue-100 text-blue-700' },
  BREAK: { row: 'bg-amber-50/60', chip: 'bg-amber-100 text-amber-700' },
  ROUTINE: { row: 'bg-slate-50', chip: 'bg-slate-200 text-slate-600' },
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
  initialAnchors,
}: {
  gradeLevel: number
  initialRules?: BellRules | null
  initialPresetKey?: string
  initialAnchors?: BellAnchors
}) {
  // D seeds B: the grade picks a starting point, the parent corrects it.
  const seed = useMemo(() => presetForGrade(gradeLevel), [gradeLevel])
  const [presetKey, setPresetKey] = useState(initialPresetKey ?? seed.key)
  const [rules, setRules] = useState<BellRules>(initialRules ?? seed.rules)
  const [anchors, setAnchors] = useState<BellAnchors>(initialAnchors ?? {})
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const issues = useMemo(() => findRuleIssues(rules), [rules])
  const slots = useMemo(() => (issues.length === 0 ? generateSlots(rules) : []), [rules, issues])
  const mismatches = useMemo(
    () => (slots.length > 0 ? validateAgainstAnchors(slots, rules, anchors) : []),
    [slots, rules, anchors]
  )

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

  const handleSave = () => {
    if (issues.length > 0) return
    setError(null)
    startTransition(async () => {
      const result = await saveBellScheduleAction({ presetKey, rules })
      if (!result.success) {
        setError(result.error ?? 'Không lưu được khung giờ')
        return
      }
      // Deliberately not cleared on a timer: this is step 1 of two, and the
      // link to step 2 has to stay put long enough to be read and clicked.
      setSaved(true)
    })
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

          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-black tracking-wide text-slate-500 uppercase">
              Đối chiếu với thông báo
            </h2>
            <p className="text-xs font-bold text-slate-400">
              Nhập giờ trường đã công bố. Nếu khung giờ tính ra lệch, chúng tôi sẽ báo cho bạn.
            </p>
            <Field label="Tan học buổi sáng">
              <input
                type="time" className={timeInput}
                value={anchors.morningEnd ?? ''}
                onChange={(e) => setAnchors((a) => ({ ...a, morningEnd: e.target.value || undefined }))}
              />
            </Field>
          </section>
        </div>

        {/* ── Preview ── */}
        <div className="flex flex-col gap-3">
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

          {mismatches.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              {mismatches.map((m) => (
                <p key={m.label} className="text-sm font-bold text-amber-700">
                  {m.label}: trường ghi {m.expected}, khung giờ tính ra {m.actual} (lệch{' '}
                  {m.deltaMinutes > 0 ? '+' : ''}
                  {m.deltaMinutes} phút)
                </p>
              ))}
            </div>
          ) : null}

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
    </div>
  )
}
