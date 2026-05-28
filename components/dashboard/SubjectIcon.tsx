/** SubjectIcon — colored square with emoji for schedule cells and lists. */

import { getSubjectById } from '@/lib/data/subjects'
import { cn } from '@/lib/utils'

interface SubjectIconProps {
  subjectId: string
  size?: number
  rounded?: number
  className?: string
}

export const SubjectIcon = ({ subjectId, size = 40, rounded = 12, className }: SubjectIconProps) => {
  const subject = getSubjectById(subjectId)
  if (!subject) {
    return (
      <div
        className={cn('shrink-0 bg-slate-100', className)}
        style={{ width: size, height: size, borderRadius: rounded }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={cn('grid shrink-0 place-items-center', className)}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: subject.color,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: Math.round(size * 0.45) }}>{subject.icon}</span>
    </div>
  )
}
