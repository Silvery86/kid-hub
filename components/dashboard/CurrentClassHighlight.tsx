import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClassPeriod, Subject } from '@/types'

interface CurrentClassHighlightProps {
  period: ClassPeriod | null
  subject: Subject | null
}

/**
 * Shows a full-colour card for the currently active class period.
 * Includes a live pulse indicator and fades to an "off-hours" state when there is no active class.
 */
export const CurrentClassHighlight = ({ period, subject }: CurrentClassHighlightProps) => {
  if (!period || !subject) {
    return (
      <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-3xl bg-slate-100 p-8 text-center">
        <Clock size={36} className="text-slate-500" aria-hidden="true" />
        <p className="text-lg font-semibold text-slate-600">Không có tiết học</p>
        <p className="text-sm text-slate-500">Ngoài giờ học</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex min-h-44 flex-col justify-between overflow-hidden rounded-3xl p-8 shadow-xl',
        subject.colorClass
      )}
      aria-label={`Đang học: ${subject.name}`}
    >
      {/* Live pulse indicator */}
      <div className="absolute top-5 right-5" aria-hidden="true">
        <span className="relative flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-white" />
        </span>
      </div>

      <p className="text-sm font-bold tracking-widest text-white/80 uppercase">Đang học</p>

      <div>
        <h2 className="mb-1 text-5xl leading-tight font-extrabold text-white">{subject.name}</h2>
        <p className="text-xl font-semibold text-white/80">
          Tiết {period.periodNumber} · {period.startTime} – {period.endTime}
        </p>
      </div>
    </div>
  )
}
