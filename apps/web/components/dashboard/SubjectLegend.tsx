/** SubjectLegend — ranked subject period counts with color bars. */

import { SubjectIcon } from '@/components/dashboard/SubjectIcon'
import { getSubjectById } from '@/lib/data/subjects'
import { countSubjectDistribution } from '@/lib/schedule-display'
import type { DailySchedule } from '@/types'

interface SubjectLegendProps {
  days: DailySchedule[]
}

export const SubjectLegend = ({ days }: SubjectLegendProps) => {
  const entries = countSubjectDistribution(days)
  const total = entries.reduce((sum, e) => sum + e.count, 0) || 1

  return (
    <div className="flex flex-col gap-2">
      {entries.map(({ subjectId, count }) => {
        const subject = getSubjectById(subjectId)
        const pct = (count / total) * 100
        return (
          <div key={subjectId} className="flex items-center gap-2.5">
            <SubjectIcon subjectId={subjectId} size={26} rounded={8} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-extrabold text-text-primary">
                  {subject?.name ?? subjectId}
                </span>
                <span className="text-[11px] font-extrabold text-text-muted">{count} tiết</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: subject?.color ?? '#94a3b8' }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
