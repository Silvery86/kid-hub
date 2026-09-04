'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  createStudentAction,
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
              {isActive ? (
                <span className="shrink-0 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-black text-white">
                  Đang xem
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void switchTo(student.id)}
                  className="shrink-0 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Chọn bé này
                </button>
              )}
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
