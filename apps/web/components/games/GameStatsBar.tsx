/** GameStatsBar — points, streak, stars, and badges chips for /games hub. */

import { cn } from '@/lib/utils'

interface GameStatsBarProps {
  points: number
  streak: number
  starsEarned: number
  starsMax: number
  badges: number
  compact?: boolean
  vertical?: boolean
  className?: string
}

export const GameStatsBar = ({
  points,
  streak,
  starsEarned,
  starsMax,
  badges,
  compact = false,
  vertical = false,
  className,
}: GameStatsBarProps) => {
  const chips = [
    { icon: '🪙', val: String(points), label: 'điểm', cls: 'bg-tier-excellent-bg text-tier-excellent-text' },
    { icon: '🔥', val: String(streak), label: 'ngày', cls: 'bg-tier-practice-bg text-tier-practice-text' },
    { icon: '⭐', val: `${starsEarned}/${starsMax}`, label: 'sao', cls: 'bg-tier-good-bg text-tier-good-text' },
    { icon: '🏆', val: String(badges), label: 'huy hiệu', cls: 'bg-schedule-soft text-tier-good-text' },
  ]

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2',
        vertical && 'flex-col',
        compact ? 'gap-1.5' : 'gap-2.5',
        className
      )}
    >
      {chips.map((c) => (
        <div
          key={c.label}
          className={cn(
            'flex items-center gap-1.5 rounded-full font-extrabold whitespace-nowrap',
            compact ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-[13px]',
            vertical && 'flex-1',
            c.cls
          )}
        >
          <span className={compact ? 'text-sm' : 'text-lg'} aria-hidden="true">
            {c.icon}
          </span>
          <span>
            {c.val} {c.label}
          </span>
        </div>
      ))}
    </div>
  )
}
