'use client'

import { cn } from '@/lib/utils'
import { getSubjectById } from '@/lib/data/subjects'

export function GradesSummaryBar({
  average,
  topSubjectId,
  compact = false,
}: {
  average: number
  topSubjectId: string | null
  compact?: boolean
}) {
  const top = topSubjectId ? getSubjectById(topSubjectId) : null

  return (
    <div className={cn('flex', compact ? 'gap-2' : 'gap-3')}>
      <div
        className={cn(
          'flex flex-1 items-center gap-2.5 rounded-[20px] bg-btn-primary text-white',
          compact ? 'p-3' : 'px-4 py-3.5'
        )}
      >
        <span className={compact ? 'text-2xl' : 'text-[32px]'} aria-hidden="true">
          📊
        </span>
        <div>
          <div className="text-[11px] font-extrabold tracking-wide uppercase opacity-85">
            Điểm TB
          </div>
          <div className={cn('font-black leading-none', compact ? 'text-[22px]' : 'text-[28px]')}>
            {average}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'flex flex-1 items-center gap-2.5 rounded-[20px] bg-emerald-50',
          compact ? 'p-3' : 'px-4 py-3.5'
        )}
      >
        {top ? (
          <div
            className={cn(
              'grid shrink-0 place-items-center rounded-[11px] text-xl',
              compact ? 'h-9 w-9' : 'h-11 w-11'
            )}
            style={{ background: `color-mix(in oklab, ${top.color} 15%, white)` }}
            aria-hidden="true"
          >
            {top.icon}
          </div>
        ) : (
          <span className="text-2xl">⭐</span>
        )}
        <div>
          <div className="text-[11px] font-extrabold tracking-wide text-slate-400 uppercase">
            Môn giỏi nhất
          </div>
          <div className={cn('font-black text-slate-800', compact ? 'text-sm' : 'text-base')}>
            {top?.name ?? '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
