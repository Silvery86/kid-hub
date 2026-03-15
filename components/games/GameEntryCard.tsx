import Link from 'next/link';
import { StarRating } from '@/components/ui/StarRating';
import { cn } from '@/lib/utils';
import type { GameBestScore, GameType } from '@/types';

interface GameEntryCardProps {
  gameType: GameType;
  title: string;
  description: string;
  emoji: string;
  href: string;
  colorClass: string;
  bestScore?: GameBestScore | null;
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
      'active:scale-[0.97] transition-transform duration-100',
      'select-none touch-manipulation',
      colorClass,
    )}
    aria-label={`Chơi ${title}`}
  >
    <div className="text-5xl" aria-hidden="true">{emoji}</div>
    <div>
      <h3 className="text-xl font-extrabold text-white">{title}</h3>
      <p className="text-white/80 text-sm">{description}</p>
    </div>
    {bestScore ? (
      <div className="flex items-center gap-2">
        <StarRating value={bestScore.starsEarned} className="[&_span]:text-2xl" />
        <span className="text-white/70 text-xs font-semibold">Kỷ lục</span>
      </div>
    ) : (
      <p className="text-white/60 text-xs font-semibold">Chưa chơi</p>
    )}
  </Link>
);
