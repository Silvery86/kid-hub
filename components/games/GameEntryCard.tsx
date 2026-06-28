/** GameEntryCard — navigation card linking to a mini-game with best-score display. */

import Link from 'next/link'
import { StarRating } from '@/components/ui/StarRating'
import { cn } from '@/lib/utils'
import type { GameBestScore, GameType } from '@/types'

interface GameEntryCardProps {
  gameType: GameType
  title: string
  description: string
  emoji: string
  href: string
  colorClass: string
  bestScore?: GameBestScore | null
}

export const GameEntryCard = ({
  title,
  description,
  emoji,
  href,
  colorClass,
  bestScore,
}: GameEntryCardProps) => (
  <Link
    href={href}
    className={cn(
      'flex flex-col gap-3 rounded-3xl p-5 shadow-lg',
      'min-h-tap-lg',
      'transition-[transform,box-shadow] duration-200 active:scale-[0.97] hover:scale-[1.02] hover:shadow-xl',
      'touch-manipulation select-none',
      colorClass
    )}
    aria-label={`Chơi ${title}`}
  >
    <div className="text-5xl" aria-hidden="true">
      {emoji}
    </div>
    <div>
      <h3 className="text-xl font-extrabold text-white">{title}</h3>
      <p className="text-sm text-white/80">{description}</p>
    </div>
    {bestScore ? (
      <div className="flex items-center gap-2">
        <StarRating value={bestScore.starsEarned} className="[&_span]:text-2xl" />
        <span className="text-xs font-semibold text-white/70">Kỷ lục</span>
      </div>
    ) : (
      <p className="text-xs font-semibold text-white/60">Chưa chơi</p>
    )}
  </Link>
)
