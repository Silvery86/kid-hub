'use client'

import { useMemo, useState } from 'react'
import { BadgeCard, type BadgeDisplayItem } from './BadgeCard'
import { BADGE_PROGRESS_HINT } from '@/lib/data/kid-access'
import { BADGE_DEFINITIONS } from '@/lib/data/badges'
import { useUserProgress } from '@/hooks/useUserProgress'
import { cn } from '@/lib/utils'

type BadgeFilter = 'all' | 'earned' | 'locked'

function BadgeFilterTabs({
  active,
  onChange,
}: {
  active: BadgeFilter
  onChange: (f: BadgeFilter) => void
}) {
  const tabs: { id: BadgeFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'earned', label: 'Đã đạt ✓' },
    { id: 'locked', label: 'Chưa đạt' },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            'rounded-full border-0 px-3.5 py-1.5 text-xs font-extrabold transition-colors',
            active === t.id
              ? 'bg-btn-primary text-white shadow-[0_4px_10px_-4px_rgba(59,130,246,0.55)]'
              : 'bg-white text-slate-500 shadow-sm'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function BadgesSummary({ earned, total, compact }: { earned: number; total: number; compact?: boolean }) {
  const stars = Math.round((earned / total) * 5) || 0
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[22px] bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-[0_12px_28px_-12px_rgba(251,191,36,0.5)]',
        compact ? 'p-3' : 'px-5 py-4 md:px-[22px] md:py-[18px]'
      )}
    >
      <div className={compact ? 'text-[40px] leading-none' : 'text-[56px] leading-none'} aria-hidden="true">
        🏆
      </div>
      <div>
        <div className="text-[11px] font-extrabold tracking-wide uppercase opacity-85">
          Bộ sưu tập huy hiệu của Khôi
        </div>
        <div className={cn('font-black leading-none', compact ? 'text-2xl' : 'text-[32px]')}>
          {earned} / {total}
        </div>
        <div className={cn('font-bold opacity-85', compact ? 'text-[11px]' : 'text-[13px]')}>
          huy hiệu đã đạt
        </div>
      </div>
      <div className="ml-auto flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={compact ? 'text-lg' : 'text-2xl'}>
            {i <= stars ? '★' : '☆'}
          </span>
        ))}
      </div>
    </div>
  )
}

export function BadgesView() {
  const { progress } = useUserProgress()
  const [filter, setFilter] = useState<BadgeFilter>('all')

  const badges: BadgeDisplayItem[] = useMemo(
    () =>
      BADGE_DEFINITIONS.map((def) => {
        const earned = progress.earnedBadges.find((b) => b.id === def.id)
        const isEarned = earned?.isEarned ?? false
        const date = earned?.earnedAt
          ? new Date(earned.earnedAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            })
          : undefined
        return {
          id: def.id,
          emoji: def.iconEmoji,
          name: def.name,
          description: def.description,
          isEarned,
          earnedLabel: date,
          progress: isEarned ? undefined : (BADGE_PROGRESS_HINT[def.id] ?? 40),
        }
      }),
    [progress.earnedBadges]
  )

  const earnedCount = badges.filter((b) => b.isEarned).length
  const filtered = badges.filter((b) => {
    if (filter === 'earned') return b.isEarned
    if (filter === 'locked') return !b.isEarned
    return true
  })

  const grid = (list: BadgeDisplayItem[], compact?: boolean) => (
    <div
      className={cn(
        'grid gap-2.5',
        compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      )}
    >
      {list.map((b) => (
        <BadgeCard key={b.id} badge={b} compact={compact} />
      ))}
    </div>
  )

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-shell-kid portrait:overflow-y-auto">
      <div className="hidden min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-4 pt-3.5 portrait:max-md:flex">
        <h1 className="text-[22px] font-black text-slate-800">Huy hiệu 🏆</h1>
        <BadgesSummary earned={earnedCount} total={badges.length} compact />
        <BadgeFilterTabs active={filter} onChange={setFilter} />
        {grid(filtered, true)}
      </div>

      <div className="hidden min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5 md:flex md:gap-5 md:p-6 lg:p-7">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-black text-slate-800 lg:text-[34px]">Huy hiệu 🏆</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 lg:text-[15px]">
              Bộ sưu tập thành tích · {earnedCount}/{badges.length} đã đạt
            </p>
          </div>
          <BadgeFilterTabs active={filter} onChange={setFilter} />
        </div>
        <BadgesSummary earned={earnedCount} total={badges.length} />
        <div className="min-h-0 flex-1 overflow-y-auto">{grid(filtered)}</div>
      </div>
    </div>
  )
}
