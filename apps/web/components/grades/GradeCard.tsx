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
        'flex items-center rounded-card shadow-sm',
        compact ? 'gap-2.5 p-3' : 'gap-3.5 p-4'
      )}
      style={{
        background: score >= 9 ? `color-mix(in oklab, ${subject.color} 8%, white)` : 'white',
      }}
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-xl text-2xl',
          compact ? 'h-9 w-9 text-lg' : 'h-12 w-12'
        )}
        style={{ background: `color-mix(in oklab, ${subject.color} 15%, white)` }}
        aria-hidden="true"
      >
        {subject.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span
            className={cn('truncate font-black text-text-primary', compact ? 'text-sm' : 'text-base')}
          >
            {subject.name}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <GradeTierBadge tier={badge} compact={compact} />
            <span
              className={cn(
                'min-w-9 text-right font-black text-text-primary',
                compact ? 'text-lg' : 'text-2xl'
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
            className={cn('animate-grow-width h-full rounded-full', barColor)}
            style={{ '--bar-pct': `${pct}%` } as React.CSSProperties}
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
