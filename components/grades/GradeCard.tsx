'use client'

import { cn } from '@/lib/utils'
import { getSubjectById } from '@/lib/data/subjects'
import { GradeTierBadge } from './GradeTierBadge'
import type { BadgeTier } from '@/types'

export function GradeCard({
  subjectId,
  score,
  badge,
  compact = false,
}: {
  subjectId: string
  score: number
  badge: BadgeTier
  compact?: boolean
}) {
  const subject = getSubjectById(subjectId)
  if (!subject) return null

  const pct = (score / 10) * 100
  const barColor =
    score >= 9 ? 'bg-amber-400' : score >= 7 ? 'bg-blue-500' : 'bg-orange-400'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[20px] bg-white shadow-sm',
        compact ? 'gap-2.5 p-3' : 'gap-3.5 p-4'
      )}
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-[13px] text-2xl',
          compact ? 'h-9 w-9 text-lg rounded-[10px]' : 'h-12 w-12'
        )}
        style={{ background: `color-mix(in oklab, ${subject.color} 15%, white)` }}
        aria-hidden="true"
      >
        {subject.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span
            className={cn('truncate font-black text-slate-800', compact ? 'text-sm' : 'text-base')}
          >
            {subject.name}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <GradeTierBadge tier={badge} compact={compact} />
            <span
              className={cn(
                'min-w-9 text-right font-black text-slate-800',
                compact ? 'text-lg' : 'text-[22px]'
              )}
            >
              {score}
            </span>
          </div>
        </div>
        <div
          className={cn('overflow-hidden rounded-full bg-slate-100', compact ? 'h-1.5' : 'h-1.5')}
        >
          <div
            className={cn('h-full rounded-full', barColor)}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={10}
          />
        </div>
      </div>
    </div>
  )
}
