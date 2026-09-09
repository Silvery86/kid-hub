/**
 * The header block of a printed thời khóa biểu: Lớp 1A1 · GVCN · SĐT · năm học.
 *
 * The teacher's phone number is shown in parent mode only. It is not a secret —
 * it is printed on the sheet that hangs on the wall at home — but a number to
 * ring an adult belongs on the adult's surface, not the child's.
 */

import { Phone, User } from 'lucide-react'

import { CURRENT_ACADEMIC_YEAR } from '@/lib/constants'

export interface ClassIdentityProps {
  className: string | null
  teacherName: string | null
  teacherPhone: string | null
  /** Parent mode adds the phone number. */
  showPhone?: boolean
}

export function ClassHeader({
  className,
  teacherName,
  teacherPhone,
  showPhone = false,
}: ClassIdentityProps) {
  // A household that never filled this in gets no empty chrome.
  if (!className && !teacherName) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[18px] bg-white px-4 py-2.5 shadow-sm">
      {className ? (
        <span className="rounded-full bg-schedule-soft px-3 py-1 text-sm font-black text-schedule-deep">
          Lớp {className}
        </span>
      ) : null}
      {teacherName ? (
        <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
          <User size={13} aria-hidden="true" /> GVCN: {teacherName}
        </span>
      ) : null}
      {showPhone && teacherPhone ? (
        <a
          href={`tel:${teacherPhone.replace(/[^\d+]/g, '')}`}
          className="flex items-center gap-1.5 text-xs font-bold text-schedule-deep underline"
        >
          <Phone size={13} aria-hidden="true" /> {teacherPhone}
        </a>
      ) : null}
      <span className="ml-auto text-[11px] font-bold text-text-muted">
        Năm học {CURRENT_ACADEMIC_YEAR}
      </span>
    </div>
  )
}
