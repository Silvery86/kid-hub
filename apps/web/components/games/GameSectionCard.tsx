'use client'

/** GameSectionCard — gradient launcher card for a math or english game suite. */

import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface GameSectionCardGame {
  id: string
  emoji: string
  name: string
  best: number
}

export interface GameSectionCardProps {
  label: string
  emoji: string
  color: string
  colorDark: string
  gradient: string
  desc: string
  href: string
  totalStars: number
  maxStars: number
  games: GameSectionCardGame[]
  compact?: boolean
}

export const GameSectionCard = ({
  label,
  emoji,
  color,
  colorDark,
  gradient,
  desc,
  href,
  totalStars,
  maxStars,
  games,
  compact = false,
}: GameSectionCardProps) => {
  const pct = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0

  return (
    <Link
      href={href}
      data-testid={`game-section-${href.replace('/', '')}`}
      className={cn(
        'relative flex w-full touch-manipulation flex-col overflow-hidden text-left text-white',
        'transition-transform duration-200 active:scale-[0.97] hover:scale-[1.02]',
        compact ? 'gap-2 rounded-card p-4' : 'gap-3 rounded-4xl p-5 sm:p-6'
      )}
      style={{
        background: gradient,
        boxShadow: `0 20px 40px -20px ${color}`,
      }}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-5 -top-5 select-none leading-none opacity-[0.15]',
          compact ? 'text-[110px]' : 'text-[140px]'
        )}
        style={{ transform: 'rotate(-8deg)' }}
        aria-hidden="true"
      >
        {emoji}
      </div>

      <div className="relative z-10 flex items-center gap-2.5">
        <div
          className={cn(
            'grid shrink-0 place-items-center rounded-2xl bg-white/20',
            compact ? 'size-11 text-2xl' : 'size-14 text-3xl'
          )}
          aria-hidden="true"
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'font-black leading-tight tracking-tight',
              compact ? 'text-lg' : 'text-2xl'
            )}
          >
            {label}
          </div>
          <div
            className={cn('mt-0.5 font-bold text-white/85', compact ? 'text-[11px]' : 'text-[13px]')}
          >
            {desc}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full bg-white font-black whitespace-nowrap',
            compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-[13px]'
          )}
          style={{ color: colorDark }}
        >
          Vào chơi →
        </span>
      </div>

      <div className="relative z-10 flex gap-2">
        {games.map((g) => (
          <div
            key={g.id}
            className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl bg-white/14 px-2.5 py-2"
          >
            <span className={compact ? 'text-lg leading-none' : 'text-[22px] leading-none'}>
              {g.emoji}
            </span>
            <span
              className={cn(
                'truncate font-extrabold leading-tight',
                compact ? 'text-[10px]' : 'text-xs'
              )}
            >
              {g.name}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'leading-none',
                    compact ? 'text-[10px]' : 'text-xs',
                    i <= g.best ? 'text-amber-400' : 'text-white/30'
                  )}
                  aria-hidden="true"
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-extrabold opacity-85">
          <span>
            {totalStars} / {maxStars} ⭐
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  )
}
