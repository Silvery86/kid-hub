'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createInviteAction } from '@/server/actions/invites.actions'
import {
  createStudentAction,
  updateClassIdentityAction,
  setActiveStudentAction,
  type StudentSummary,
} from '@/server/actions/students.actions'
import { cn } from '@/lib/utils'

export function StudentsView({
  students,
  activeStudentId,
}: {
  students: StudentSummary[]
  activeStudentId: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState(1)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // The code exists in the clear exactly once — here. Nothing can show it again.
  const [invite, setInvite] = useState<{ studentId: string; code: string } | null>(null)
  /** Which student's class-identity form is open. Only one at a time. */
  const [editing, setEditing] = useState<string | null>(null)

  const add = useCallback(async () => {
    if (isSubmitting) return
    setError('')
    setIsSubmitting(true)

    const result = await createStudentAction({ name, gradeLevel })
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Không thêm được bé')
      return
    }
    setName('')
    setGradeLevel(1)
    router.refresh()
  }, [name, gradeLevel, isSubmitting, router])

  const inviteFor = useCallback(async (studentId: string) => {
    setError('')
    setInvite(null)
    const result = await createInviteAction({ studentId })
    if (!result.success) {
      setError(result.error ?? 'Không tạo được mã mời')
      return
    }
    setInvite({ studentId, code: result.data.code })
  }, [])

  const switchTo = useCallback(
    async (studentId: string) => {
      setError('')
      const result = await setActiveStudentAction(studentId)
      if (!result.success) {
        setError(result.error ?? 'Không đổi được bé')
        return
      }
      router.refresh()
    },
    [router]
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-black tracking-tight text-slate-800 md:text-[30px]">
            👧 Các bé
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Chọn bé đang xem, hoặc thêm bé mới vào tài khoản.
          </p>
        </div>
        <Link
          href="/parent"
          className="rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-slate-500 shadow-sm transition-colors hover:bg-slate-100"
        >
          ← Parent Mode
        </Link>
      </header>

      {error ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      ) : null}

      <ul className="m-0 mb-6 flex list-none flex-col gap-2 p-0">
        {students.map((student) => {
          const isActive = student.id === activeStudentId
          return (
            <li
              key={student.id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5 shadow-sm',
                isActive ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-white'
              )}
            >
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-black text-slate-800">{student.name}</p>
                <p className="m-0 text-xs font-bold text-slate-400">
                  Lớp {student.gradeLevel}
                  {student.role === 'GUARDIAN' ? ' · được chia sẻ' : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing((id) => (id === student.id ? null : student.id))}
                  className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200"
                >
                  {student.className ? `Lớp ${student.className}` : 'Thông tin lớp'}
                </button>
                <button
                  type="button"
                  onClick={() => void inviteFor(student.id)}
                  className="rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  Mời phụ huynh
                </button>
                {isActive ? (
                  <span className="rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-black text-white">
                    Đang xem
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void switchTo(student.id)}
                    className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    Chọn bé này
                  </button>
                )}
              </div>

              {editing === student.id ? (
                <ClassIdentityForm
                  student={student}
                  onDone={() => {
                    setEditing(null)
                    router.refresh()
                  }}
                />
              ) : null}

              {invite?.studentId === student.id ? (
                <div className="w-full rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="m-0 text-xs font-bold text-emerald-700">
                    Gửi mã này cho phụ huynh còn lại. Mã chỉ hiện một lần và có hạn 7 ngày.
                  </p>
                  <p className="m-0 mt-1.5 font-mono text-lg font-black tracking-[0.2em] text-emerald-900">
                    {invite.code}
                  </p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="m-0 mb-3 text-sm font-black text-slate-700">Thêm bé mới</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên của bé"
            className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-400 focus:outline-none"
          />
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(Number(e.target.value))}
            aria-label="Lớp"
            className="shrink-0 rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-400 focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={isSubmitting}
            className="shrink-0 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Đang thêm…' : 'Thêm'}
          </button>
        </div>
      </section>
    </div>
  )
}

/**
 * The header block of a printed thời khóa biểu, per child.
 *
 * Every field is optional and saved together: a parent who only knows the class
 * name should not be blocked on a phone number they have to go and find.
 */
function ClassIdentityForm({
  student,
  onDone,
}: {
  student: StudentSummary
  onDone: () => void
}) {
  const [className, setClassName] = useState(student.className ?? '')
  const [teacherName, setTeacherName] = useState(student.teacherName ?? '')
  const [teacherPhone, setTeacherPhone] = useState(student.teacherPhone ?? '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const save = async () => {
    if (isSaving) return
    setError('')
    setIsSaving(true)
    const result = await updateClassIdentityAction({
      studentId: student.id,
      className,
      teacherName,
      teacherPhone,
    })
    setIsSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Không lưu được thông tin lớp')
      return
    }
    onDone()
  }

  const field =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none'

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-extrabold tracking-wide text-slate-400 uppercase">Lớp</span>
          <input
            type="text" maxLength={20} className={field}
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="1A1"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-extrabold tracking-wide text-slate-400 uppercase">GVCN</span>
          <input
            type="text" maxLength={80} className={field}
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Nguyễn Thị..."
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-extrabold tracking-wide text-slate-400 uppercase">Số điện thoại</span>
          <input
            type="tel" maxLength={20} className={field}
            value={teacherPhone}
            onChange={(e) => setTeacherPhone(e.target.value)}
            placeholder="0375197591"
          />
        </label>
      </div>
      {error ? <p className="m-0 text-xs font-bold text-red-600">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={isSaving}
          className="rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl bg-slate-200 px-3.5 py-2 text-xs font-black text-slate-600"
        >
          Đóng
        </button>
      </div>
    </div>
  )
}
