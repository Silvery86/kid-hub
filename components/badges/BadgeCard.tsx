'use client'

import { cn } from '@/lib/utils'

export interface BadgeDisplayItem {
  id: string
  emoji: string
  name: string
  description: string
  isEarned: boolean
  earnedLabel?: string
  progress?: number
}

export function BadgeCard({
  badge,
  compact = false,
}: {
  badge: BadgeDisplayItem
  compact?: boolean
}) {
  const pct = badge.isEarned ? 100 : (badge.progress ?? 0)

  return (
    <div
      className={cn(
        'flex flex-col gap-2 text-left',
        compact ? 'rounded-[18px] p-3.5' : 'rounded-[22px] p-4 md:p-[18px]',
        badge.isEarned
          ? 'border-2 border-amber-200 bg-white shadow-[0_4px_12px_-6px_rgba(251,191,36,0.4)]'
          : 'border-2 border-slate-200 bg-slate-50 opacity-75'
      )}
    >
      <div
        className={cn('leading-none', compact ? 'text-[32px]' : 'text-[40px]')}
        style={{ filter: badge.isEarned ? 'none' : 'grayscale(0.6)' }}
        aria-hidden="true"
      >
        {badge.emoji}
      </div>
      <div>
        <div className={cn('font-black text-slate-800', compact ? 'text-xs' : 'text-sm')}>
          {badge.name}
        </div>
        <div
          className={cn(
            'mt-0.5 font-bold leading-snug text-slate-500',
            compact ? 'text-[10px]' : 'text-[11px]'
          )}
        >
          {badge.description}
        </div>
      </div>
      {badge.isEarned ? (
        <div className={cn('font-extrabold text-amber-800', compact ? 'text-[10px]' : 'text-[11px]')}>
          {badge.earnedLabel ?? '✓'} Đã đạt
        </div>
      ) : (
        <div>
          <div className={cn('overflow-hidden rounded-full bg-slate-200', compact ? 'h-1' : 'h-1.5')}>
            <div
              className="h-full rounded-full bg-btn-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] font-bold text-slate-400">{pct}%</div>
        </div>
      )}
    </div>
  )
}
