'use client'

/** SubjectCard — tappable card linking a scheduled period to its game or info page. */

import {
  Calculator,
  BookOpen,
  Globe,
  Leaf,
  Heart,
  Dumbbell,
  Music,
  Palette,
  Monitor,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClassPeriod, Subject } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator,
  BookOpen,
  Globe,
  Leaf,
  Heart,
  Dumbbell,
  Music,
  Palette,
  Monitor,
  Star,
}

interface SubjectCardProps {
  period: ClassPeriod
  subject: Subject
  isActive?: boolean
  isNext?: boolean
  isCompact?: boolean
}

export const SubjectCard = ({
  period,
  subject,
  isActive = false,
  isNext = false,
  isCompact = false,
}: SubjectCardProps) => {
  const Icon = ICON_MAP[subject.iconName] ?? Star

  return (
    <div
      role="listitem"
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 transition-[transform,background-color,box-shadow] duration-300',
        isCompact ? 'py-2' : 'py-3',
        isActive ? 'scale-[1.01] bg-white shadow-lg ring-2 ring-blue-400' : 'bg-white',
        isNext && !isActive && 'bg-blue-50'
      )}
    >
      {/* Subject icon bubble */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl text-white',
          subject.colorClass,
          isCompact ? 'h-9 w-9' : 'h-12 w-12'
        )}
        aria-hidden="true"
      >
        <Icon size={isCompact ? 16 : 22} strokeWidth={2} />
      </div>

      {/* Period info */}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-bold text-slate-800', isCompact ? 'text-sm' : 'text-base')}>
          {subject.name}
        </p>
        <p className={cn('text-slate-500', isCompact ? 'text-xs' : 'text-sm')}>
          Tiết {period.periodNumber} · {period.startTime} – {period.endTime}
        </p>
      </div>

      {/* Status pill */}
      {isActive && (
        <span className="shrink-0 rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-600">
          Đang học
        </span>
      )}
      {!isActive && isNext && (
        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
          Tiếp theo
        </span>
      )}
    </div>
  )
}
