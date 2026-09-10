'use client'

/**
 * The child chip in the parent header, and the way out of parent mode.
 *
 * Two things were missing before this: parent mode had no route into the kid
 * app at all, and the chip was a static label that hard-coded "Lớp 1A" — fine
 * with one child, wrong the moment there are two in different grades, and wrong
 * again the moment one is promoted.
 *
 * Picking a child does NOT walk straight into the kid app. It sets the active
 * student and navigates to /dashboard, which middleware sends to /kid-unlock
 * for the pattern — the child's own gate, and the reason a parent handing over
 * the phone is not also handing over parent mode. Middleware drops the PIN
 * proof on the way, which is the intended behaviour, not a side effect.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Settings2 } from 'lucide-react'

import { FEEDBACK } from '@kid-hub/shared'

import { setActiveStudentAction } from '@/server/actions/students.actions'
import type { StudentSummary } from '@/server/actions/students.actions'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

export interface StudentSwitcherProps {
  students: StudentSummary[]
  activeStudentId: string | null
  /** Falls back to this when the list has not loaded — keeps the header stable. */
  studentName: string
  /** `compact` is the mobile header, where there is no room for the grade line. */
  variant?: 'default' | 'compact'
}

/** "1A1" if the parent filled in the printed header, otherwise "Lớp 1". */
const classLabel = (student: StudentSummary): string =>
  student.className ? `Lớp ${student.className}` : `Lớp ${student.gradeLevel}`

export function StudentSwitcher({
  students,
  activeStudentId,
  studentName,
  variant = 'default',
}: StudentSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  const active = students.find((s) => s.id === activeStudentId)
  const label = active?.name ?? studentName

  // A dropdown that survives a tap elsewhere is a dropdown the parent has to
  // fight. Pointerdown rather than click so it closes before the tap lands.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  /** Hand the phone to this child: set who is active, then let the pattern gate run. */
  const enterKidMode = useCallback(
    (studentId: string) => {
      startTransition(async () => {
        const result = await setActiveStudentAction(studentId)
        if (!result.success) {
          toast.error(result.error ?? FEEDBACK.students.switchFailed)
          return
        }
        setOpen(false)
        // No success toast: the navigation to /kid-unlock is the confirmation,
        // and a toast would follow the parent into the child's unlock screen.
        router.push('/dashboard')
      })
    },
    [router]
  )

  /** Keep managing, but for a different child. */
  const manageInstead = useCallback(
    (studentId: string) => {
      const student = students.find((s) => s.id === studentId)
      startTransition(async () => {
        const result = await setActiveStudentAction(studentId)
        if (!result.success) {
          toast.error(result.error ?? FEEDBACK.students.switchFailed)
          return
        }
        setOpen(false)
        // Switching who is being managed changes the whole page under the
        // parent; saying which child now owns it is the point.
        if (student) toast.success(FEEDBACK.students.switched(student.name))
        router.refresh()
      })
    },
    [router, students]
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center rounded-pill bg-white shadow-sm transition-colors hover:bg-slate-50',
          variant === 'compact' ? 'gap-1.5 px-2 py-1' : 'gap-2 px-3 py-1.5'
        )}
      >
        <span
          className={cn(
            'grid place-items-center rounded-full bg-amber-100',
            variant === 'compact' ? 'size-6' : 'size-7'
          )}
        >
          🧒
        </span>
        {variant === 'compact' ? (
          <span className="text-xs font-black text-text-primary">{label}</span>
        ) : (
          <span className="leading-tight">
            <span className="block text-xs font-black text-text-primary">{label}</span>
            <span className="block text-[10px] font-bold text-text-muted">
              {active ? classLabel(active) : 'Chọn bé'}
            </span>
          </span>
        )}
        <ChevronDown
          size={14}
          className={cn('text-text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <p className="px-4 pt-3 pb-1 text-[11px] font-extrabold tracking-wide text-text-muted uppercase">
            Chọn bé để vào chế độ học sinh
          </p>


          <ul className="max-h-72 overflow-auto px-2 pb-2">
            {students.length === 0 ? (
              <li className="px-2 py-3 text-xs font-bold text-text-muted">
                Chưa có bé nào trong tài khoản.
              </li>
            ) : (
              students.map((student) => {
                const isActive = student.id === activeStudentId
                return (
                  <li key={student.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isPending}
                      onClick={() => enterKidMode(student.id)}
                      className="flex min-h-12 flex-1 items-center gap-2.5 rounded-xl px-2 text-left hover:bg-slate-50 disabled:opacity-50"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-100 text-lg">
                        🧒
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-black text-text-primary">
                            {student.name}
                          </span>
                          {isActive ? (
                            <Check size={13} className="shrink-0 text-blue-500" />
                          ) : null}
                        </span>
                        <span className="block text-[11px] font-bold text-text-muted">
                          {classLabel(student)}
                          {isActive ? ' · đang quản lý' : ''}
                        </span>
                      </span>
                    </button>
                    {/* Switching who the parent is MANAGING is a different act
                        from handing the phone over, so it gets its own control
                        rather than being guessed from the same tap. */}
                    {!isActive ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => manageInstead(student.id)}
                        title={`Quản lý ${student.name} trong Parent Mode`}
                        className="shrink-0 rounded-lg px-2 py-2 text-[10px] font-black text-text-muted hover:bg-slate-100 hover:text-text-primary disabled:opacity-50"
                      >
                        Quản lý
                      </button>
                    ) : null}
                  </li>
                )
              })
            )}
          </ul>

          <Link
            href="/parent/students"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-xs font-black text-text-secondary hover:bg-slate-50"
          >
            <Settings2 size={14} /> Quản lý danh sách bé
          </Link>
        </div>
      ) : null}
    </div>
  )
}
