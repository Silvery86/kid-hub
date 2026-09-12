'use client'

/**
 * Môn học của bé — what this class is taught, and what the school adds to it.
 *
 * Two halves with deliberately different powers. The programme's subjects are
 * read-only: every school in Vietnam teaches the same one, so there is nothing
 * here for a parent to decide and a rename would only drift their child's data
 * away from everyone else's (docs/SCHEDULE_SUBJECT.md S2, S3). The school's own
 * subjects are entirely theirs — add, rename, recolour, delete.
 *
 * Lesson variants are NOT edited here, which departs from the first draft of §8.2.
 * They are learnt from what the parent types in the week grid, so a variant has
 * no store of its own to write into; the count shown against each subject is
 * what the household has already taught the app.
 */

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  CUSTOM_SUBJECT_COLORS,
  CUSTOM_SUBJECT_ICONS,
  CUSTOM_LABEL,
  FEEDBACK,
  subjectGroupsForPicker,
  type CustomSubjectRow,
} from '@kid-hub/shared'

import {
  addCustomSubjectAction,
  deleteCustomSubjectAction,
  getSubjectUsageAction,
  updateCustomSubjectAction,
} from '@/server/actions/subjects.actions'
import { toast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { KidButton } from '@/components/ui/KidButton'
import { cn } from '@/lib/utils'

interface Draft {
  subjectId: string | null
  name: string
  color: string
  icon: string
}

const emptyDraft = (): Draft => ({
  subjectId: null,
  name: '',
  color: CUSTOM_SUBJECT_COLORS[0],
  icon: CUSTOM_SUBJECT_ICONS[0],
})

const LEVEL_LABEL = (grade: number): string =>
  grade <= 0 ? 'Chưa rõ lớp' : grade <= 5 ? 'Tiểu học' : grade <= 9 ? 'THCS' : 'THPT'

export function SubjectSettings({
  gradeLevel,
  className,
  initialCustom,
  rememberedVariants,
}: {
  gradeLevel: number
  className: string | null
  initialCustom: CustomSubjectRow[]
  rememberedVariants: Record<string, string[]>
}) {
  const [custom, setCustom] = useState<CustomSubjectRow[]>(initialCustom)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CustomSubjectRow | null>(null)
  const [isPending, startTransition] = useTransition()

  // The same grouping the week grid's picker uses, so this screen can never show
  // a set the picker disagrees with.
  const groups = useMemo(
    () => subjectGroupsForPicker(gradeLevel, [], custom),
    [gradeLevel, custom]
  )

  const startAdd = () => {
    setError(null)
    setDraft(emptyDraft())
  }

  const startEdit = (row: CustomSubjectRow) => {
    setError(null)
    setDraft({ subjectId: row.subjectId, name: row.name, color: row.color, icon: row.icon })
  }

  const save = () => {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) {
      setError(FEEDBACK.subjects.addFailed)
      return
    }
    setError(null)

    startTransition(async () => {
      const payload = { name, color: draft.color, icon: draft.icon }
      const result = draft.subjectId
        ? await updateCustomSubjectAction({ ...payload, subjectId: draft.subjectId })
        : await addCustomSubjectAction(payload)

      if (!result.success) {
        setError(result.error ?? FEEDBACK.subjects.saveFailed)
        return
      }

      // Optimistic locally so the list settles without a round trip; the server
      // action has already revalidated every page that renders a subject.
      setCustom((rows) =>
        draft.subjectId
          ? rows.map((r) => (r.subjectId === draft.subjectId ? { ...r, ...payload } : r))
          : [...rows, { subjectId: `pending-${name}`, ...payload }]
      )
      toast.success(draft.subjectId ? FEEDBACK.subjects.saved : FEEDBACK.subjects.added)
      setDraft(null)
    })
  }

  /**
   * The usage check runs BEFORE the dialog opens, so a parent never meets a
   * delete button that is going to refuse them.
   */
  const askDelete = (row: CustomSubjectRow) => {
    setError(null)
    startTransition(async () => {
      const usage = await getSubjectUsageAction({ subjectId: row.subjectId })
      if (!usage.success) {
        setError(usage.error ?? FEEDBACK.subjects.loadFailed)
        return
      }
      if (usage.data.periods + usage.data.homework + usage.data.grades > 0) {
        setError(FEEDBACK.subjects.inUse(usage.data))
        return
      }
      setPendingDelete(row)
    })
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    const target = pendingDelete
    startTransition(async () => {
      const result = await deleteCustomSubjectAction({ subjectId: target.subjectId })
      setPendingDelete(null)
      if (!result.success) {
        setError(result.error ?? FEEDBACK.subjects.deleteFailed)
        return
      }
      setCustom((rows) => rows.filter((r) => r.subjectId !== target.subjectId))
      toast.success(FEEDBACK.subjects.deleted)
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <Link
          href="/parent?view=schedule"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft size={16} /> Thời khoá biểu
        </Link>
        <h1 className="text-xl font-black text-slate-800 md:text-2xl">Môn học của bé</h1>
        <p className="mt-1 text-sm font-bold text-slate-500">
          {className ? `Lớp ${className} · ` : ''}
          {LEVEL_LABEL(gradeLevel)} · theo chương trình GDPT 2018
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          const isCustom = group.label === CUSTOM_LABEL
          return (
            <section
              key={group.label}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <h2 className="flex items-center gap-2 text-sm font-black tracking-wide text-slate-500 uppercase">
                {isCustom ? null : <Lock size={13} className="text-slate-300" />}
                {group.label}
                <span className="ml-auto text-slate-300">{group.subjects.length}</span>
              </h2>

              <ul className="flex flex-col gap-1.5">
                {group.subjects.map((subject) => {
                  const learnt = rememberedVariants[subject.id]?.length ?? 0
                  return (
                    <li
                      key={subject.id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-sm"
                        style={{ background: `color-mix(in srgb, ${subject.color} 18%, white)` }}
                        aria-hidden="true"
                      >
                        {subject.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-700">
                          {subject.name}
                        </span>
                        <span className="block text-xs font-bold text-slate-400">
                          {learnt > 0 ? `${learnt} biến thể đã dùng` : 'chưa có biến thể'}
                        </span>
                      </span>

                      {isCustom ? (
                        <span className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            aria-label={`Sửa ${subject.name}`}
                            onClick={() =>
                              startEdit(custom.find((c) => c.subjectId === subject.id)!)
                            }
                            className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Xoá ${subject.name}`}
                            onClick={() =>
                              askDelete(custom.find((c) => c.subjectId === subject.id)!)
                            }
                            className="grid size-9 place-items-center rounded-lg border border-red-100 bg-white text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>

              {isCustom ? null : (
                <p className="text-xs font-bold text-slate-400">
                  Theo Thông tư 32/2018 — không sửa được tên hay màu. Biến thể tiết học được
                  nhớ lại từ những gì bạn gõ trong lưới tuần.
                </p>
              )}
            </section>
          )
        })}

        {/* ── Add / edit ── */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-black tracking-wide text-slate-500 uppercase">
            Môn của trường
          </h2>
          <p className="text-xs font-bold text-slate-400">
            Môn trường có mà chương trình không nêu tên — Toán tiếng Anh, câu lạc bộ, ngoại
            ngữ thứ hai.
          </p>

          {draft ? (
            <>
              <input
                type="text" maxLength={40} placeholder="Tên môn học"
                value={draft.name}
                onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
              />

              <div className="flex flex-wrap gap-1.5">
                {CUSTOM_SUBJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Màu ${color}`}
                    aria-pressed={draft.color === color}
                    onClick={() => setDraft((d) => (d ? { ...d, color } : d))}
                    style={{ background: color }}
                    className={cn(
                      'size-8 rounded-lg',
                      draft.color === color && 'ring-2 ring-slate-800 ring-offset-2'
                    )}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {CUSTOM_SUBJECT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    aria-label={`Biểu tượng ${icon}`}
                    aria-pressed={draft.icon === icon}
                    onClick={() => setDraft((d) => (d ? { ...d, icon } : d))}
                    className={cn(
                      'grid size-9 place-items-center rounded-lg border-2 text-base',
                      draft.icon === icon
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <KidButton
                  variant="ghost"
                  onClick={() => { setDraft(null); setError(null) }}
                  isDisabled={isPending}
                  className="min-h-12 flex-1 text-base"
                >
                  Huỷ
                </KidButton>
                <KidButton
                  variant="primary"
                  onClick={save}
                  isLoading={isPending}
                  className="min-h-12 flex-1 text-base"
                >
                  {draft.subjectId ? 'Lưu' : 'Thêm môn'}
                </KidButton>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={startAdd}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-black text-slate-500 hover:border-blue-400 hover:text-blue-600"
            >
              <Plus size={16} /> Thêm môn của trường
            </button>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={pendingDelete != null}
        title={`Xoá ${pendingDelete?.name ?? 'môn học'}?`}
        description={
          <p>Môn này chưa được dùng ở tiết học, bài tập hay cột điểm nào, nên xoá được.</p>
        }
        confirmLabel="Xoá môn"
        cancelLabel="Giữ lại"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        onDismiss={() => setPendingDelete(null)}
        isPending={isPending}
      />
    </div>
  )
}
