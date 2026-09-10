'use client'

/**
 * Ngày nghỉ — the days the timetable does not run.
 *
 * Two kinds sit here, and the screen keeps them apart because they are entered
 * for different reasons (docs/SCHEDULE_PARENT_IMP.md §13):
 *
 *  - Nghỉ lễ: mostly the shipped Vietnamese list, corrected by the parent. The
 *    lunar ones (Tết, Giỗ Tổ) arrive flagged, because their real dates are
 *    announced per province and we are guessing.
 *
 *  - Nghỉ hè: nobody can ship this. The school announces it, it runs two to
 *    three months, and it spans the change from one grade to the next. Summer
 *    classes and summer homework carry on through it, so it hides the school
 *    timetable and nothing else.
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CalendarPlus,
  GraduationCap,
  Pencil,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react'
import {
  breakLengthInDays,
  pendingPromotion,
  upcomingBreaks,
  localIsoDate,
  type SchoolBreak,
  type SchoolBreakKind,
} from '@kid-hub/shared'

import {
  addHolidayPresetsAction,
  applyGradePromotionAction,
  deleteSchoolBreakAction,
  saveSchoolBreakAction,
} from '@/server/actions/schedule.actions'
import { FullScreenModal } from '@/components/ui/FullScreenModal'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

interface Draft {
  id?: string
  kind: SchoolBreakKind
  label: string
  startDate: string
  endDate: string
  /** Summer only. Empty string means "don't ask me about grades for this one". */
  promotesToGrade: string
}

const emptyDraft = (kind: SchoolBreakKind, gradeLevel: number): Draft => ({
  kind,
  label: kind === 'SUMMER_BREAK' ? 'Nghỉ hè' : '',
  startDate: '',
  endDate: '',
  // Offered, not assumed: the parent can set the same grade for a repeated
  // year, or clear it entirely if they only wanted to block out lessons.
  promotesToGrade: kind === 'SUMMER_BREAK' && gradeLevel < 12 ? String(gradeLevel + 1) : '',
})

/** "2027-02-03" → "03/02/2027". */
const displayDate = (iso: string): string =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : ''

const rangeLabel = (brk: SchoolBreak): string => {
  const days = breakLengthInDays(brk)
  if (brk.startDate === brk.endDate) return displayDate(brk.startDate)
  return `${displayDate(brk.startDate)} – ${displayDate(brk.endDate)} · ${days} ngày`
}

export function SchoolBreakManager({
  initialBreaks,
  gradeLevel,
}: {
  initialBreaks: SchoolBreak[]
  /** The child's grade today — the default the next summer promotes from. */
  gradeLevel: number
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const today = localIsoDate()
  const holidays = initialBreaks.filter((b) => b.kind === 'PUBLIC_HOLIDAY')
  const summers = initialBreaks.filter((b) => b.kind === 'SUMMER_BREAK')
  const upcoming = upcomingBreaks(initialBreaks, today)
  const nextBreak = upcoming[0]
  const promotion = pendingPromotion(initialBreaks, today)

  const submit = () => {
    if (!draft) return
    setError(null)
    startTransition(async () => {
      const { promotesToGrade, ...rest } = draft
      const result = await saveSchoolBreakAction({
        ...rest,
        ...(rest.kind === 'SUMMER_BREAK' && promotesToGrade
          ? { promotesToGrade: Number(promotesToGrade) }
          : {}),
      })
      if (!result.success) {
        setError(result.error ?? 'Không lưu được')
        return
      }
      setDraft(null)
      router.refresh()
    })
  }

  const remove = (brk: SchoolBreak) => {
    if (!brk.id) return
    setError(null)
    startTransition(async () => {
      const result = await deleteSchoolBreakAction(brk.id!)
      if (!result.success) {
        setError(result.error ?? 'Không xóa được')
        return
      }
      router.refresh()
    })
  }

  const confirmPromotion = () => {
    if (!promotion?.id) return
    setError(null)
    setNote(null)
    startTransition(async () => {
      const result = await applyGradePromotionAction(promotion.id!)
      if (!result.success) {
        setError(result.error ?? 'Không chuyển lớp được')
        return
      }
      setNote(`Đã chuyển con lên lớp ${result.data.gradeLevel}.`)
      router.refresh()
    })
  }

  const addPresets = () => {
    setError(null)
    setNote(null)
    startTransition(async () => {
      const result = await addHolidayPresetsAction()
      if (!result.success) {
        setError(result.error ?? 'Không thêm được')
        return
      }
      setNote(
        result.data.added > 0
          ? `Đã thêm ${result.data.added} ngày lễ. Hãy kiểm tra lại ngày Tết và Giỗ Tổ.`
          : 'Đã có đủ các ngày lễ trong danh sách.'
      )
      router.refresh()
    })
  }

  const renderRow = (brk: SchoolBreak) => (
    <li
      key={brk.id}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-black text-slate-800">{brk.label}</span>
          {brk.needsReview ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              Kiểm tra lại ngày
            </span>
          ) : null}
        </div>
        <p className="text-xs font-bold text-slate-500">{rangeLabel(brk)}</p>
      </div>
      <button
        type="button"
        onClick={() =>
          setDraft({
            id: brk.id!,
            kind: brk.kind,
            label: brk.label,
            startDate: brk.startDate,
            endDate: brk.endDate,
            promotesToGrade: brk.promotesToGrade ? String(brk.promotesToGrade) : '',
          })
        }
        aria-label={`Sửa ${brk.label}`}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        onClick={() => remove(brk)}
        aria-label={`Xóa ${brk.label}`}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={16} />
      </button>
    </li>
  )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link
          href="/parent?view=schedule"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          aria-label="Quay lại lịch học"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-black text-slate-800">Ngày nghỉ</h1>
          <p className="text-xs font-bold text-slate-500">
            Những ngày con không học theo thời khóa biểu
          </p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <AlertCircle size={16} /> {error}
        </div>
      ) : null}
      {note ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {note}
        </div>
      ) : null}

      {/* Asked, never assumed. The date decides when the question is worth
          putting; the parent decides the answer — a child repeating a year is
          exactly why this is not a scheduled job. */}
      {promotion ? (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <GraduationCap size={16} className="text-emerald-600" />
            <p className="text-[11px] font-extrabold tracking-wide text-emerald-600 uppercase">
              Năm học mới
            </p>
          </div>
          <p className="mt-0.5 text-sm font-black text-emerald-900">
            {promotion.label} đã kết thúc. Con lên lớp {promotion.promotesToGrade}?
          </p>
          <p className="mt-0.5 text-xs font-bold text-emerald-700">
            Nếu con học lại lớp cũ, hãy sửa kỳ nghỉ bên dưới trước khi xác nhận.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <KidButton
              variant="primary"
              onClick={confirmPromotion}
              isDisabled={isPending}
              className="min-h-10 px-4 text-xs"
            >
              {isPending ? 'Đang cập nhật...' : `Xác nhận lên lớp ${promotion.promotesToGrade}`}
            </KidButton>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  id: promotion.id!,
                  kind: promotion.kind,
                  label: promotion.label,
                  startDate: promotion.startDate,
                  endDate: promotion.endDate,
                  promotesToGrade: promotion.promotesToGrade
                    ? String(promotion.promotesToGrade)
                    : '',
                })
              }
              className="min-h-10 rounded-xl px-3 text-xs font-black text-emerald-700 hover:bg-emerald-100"
            >
              Sửa kỳ nghỉ
            </button>
          </div>
        </div>
      ) : null}

      {nextBreak ? (
        <div className="rounded-2xl bg-blue-50 px-4 py-3">
          <p className="text-[11px] font-extrabold tracking-wide text-blue-500 uppercase">
            Kỳ nghỉ tới
          </p>
          <p className="text-sm font-black text-blue-900">
            {nextBreak.label} · {rangeLabel(nextBreak)}
          </p>
        </div>
      ) : null}

      {/* ── Nghỉ hè ── */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-black text-slate-700">
            <Sun size={16} className="text-amber-500" /> Nghỉ hè
          </h2>
          <button
            type="button"
            onClick={() => setDraft(emptyDraft('SUMMER_BREAK', gradeLevel))}
            className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-black text-blue-600 hover:bg-blue-50"
          >
            <CalendarPlus size={14} /> Thêm kỳ nghỉ hè
          </button>
        </div>
        {summers.length > 0 ? (
          <ul className="flex flex-col gap-2">{summers.map(renderRow)}</ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
            Khi trường thông báo lịch nghỉ hè, hãy thêm vào đây. Trong thời gian
            nghỉ hè, thời khóa biểu ở trường sẽ tạm dừng nhưng lớp học hè và bài
            tập hè vẫn hiển thị bình thường.
          </p>
        )}
      </section>

      {/* ── Nghỉ lễ ── */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-700">Nghỉ lễ</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={addPresets}
              disabled={isPending}
              className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-black text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              <Sparkles size={14} /> Thêm ngày lễ Việt Nam
            </button>
            <button
              type="button"
              onClick={() => setDraft(emptyDraft('PUBLIC_HOLIDAY', gradeLevel))}
              className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-black text-blue-600 hover:bg-blue-50"
            >
              <CalendarPlus size={14} /> Thêm
            </button>
          </div>
        </div>
        {holidays.length > 0 ? (
          <ul className="flex flex-col gap-2">{holidays.map(renderRow)}</ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
            Chưa có ngày lễ nào. Bấm &ldquo;Thêm ngày lễ Việt Nam&rdquo; để lấy
            danh sách Tết, 30/4, 2/9... rồi sửa lại cho đúng lịch của trường.
          </p>
        )}
      </section>

      <FullScreenModal
        isOpen={draft !== null}
        hasCloseButton={false}
        className="flex h-full w-full items-center justify-center p-4"
      >
        {draft ? (
          <div className="w-full max-w-sm rounded-[26px] bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-black text-slate-800">
              {draft.id ? 'Sửa kỳ nghỉ' : draft.kind === 'SUMMER_BREAK' ? 'Thêm nghỉ hè' : 'Thêm ngày lễ'}
            </h2>

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                Tên kỳ nghỉ
              </span>
              <input
                autoFocus
                type="text"
                maxLength={60}
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder={draft.kind === 'SUMMER_BREAK' ? 'Nghỉ hè lên lớp 2' : 'Tết Nguyên Đán'}
                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </label>

            <div className="mt-3 flex gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                  Từ ngày
                </span>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => {
                    const startDate = e.target.value
                    // A range that ends before it starts covers nothing at all,
                    // so the end follows the start rather than going invalid.
                    setDraft({
                      ...draft,
                      startDate,
                      endDate: draft.endDate && draft.endDate < startDate ? startDate : draft.endDate,
                    })
                  }}
                  className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                  Đến ngày
                </span>
                <input
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate || undefined}
                  onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                  className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                />
              </label>
            </div>

            {draft.kind === 'SUMMER_BREAK' ? (
              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                  Sau kỳ nghỉ con học lớp
                </span>
                <select
                  value={draft.promotesToGrade}
                  onChange={(e) => setDraft({ ...draft, promotesToGrade: e.target.value })}
                  className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Không thay đổi lớp</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                      {g === gradeLevel ? ' (học lại)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] font-bold text-slate-400">
                  Khi kỳ nghỉ kết thúc, ứng dụng sẽ hỏi lại trước khi đổi lớp.
                </span>
              </label>
            ) : null}

            {draft.startDate && draft.endDate && draft.endDate >= draft.startDate ? (
              <p
                className={cn(
                  'mt-3 rounded-xl px-3 py-2 text-xs font-bold',
                  draft.kind === 'SUMMER_BREAK' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
                )}
              >
                Nghỉ{' '}
                {breakLengthInDays({
                  kind: draft.kind,
                  label: draft.label,
                  startDate: draft.startDate,
                  endDate: draft.endDate,
                })}{' '}
                ngày
                {draft.kind === 'SUMMER_BREAK'
                  ? ' — thời khóa biểu ở trường tạm dừng, lớp học hè và bài tập hè vẫn giữ nguyên.'
                  : '.'}
              </p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="min-h-11 rounded-xl px-4 text-xs font-black text-slate-500 hover:bg-slate-100"
              >
                Hủy
              </button>
              <KidButton
                variant="primary"
                onClick={submit}
                isDisabled={
                  isPending ||
                  !draft.label.trim() ||
                  !draft.startDate ||
                  !draft.endDate ||
                  draft.endDate < draft.startDate
                }
                className="min-h-11 px-6"
              >
                {isPending ? 'Đang lưu...' : 'Lưu'}
              </KidButton>
            </div>
          </div>
        ) : null}
      </FullScreenModal>
    </div>
  )
}
