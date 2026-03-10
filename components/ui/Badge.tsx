import { cn } from '@/lib/utils';
import type { BadgeTier } from '@/types';

interface BadgeProps {
  variant: BadgeTier;
  label?: string;
  className?: string;
}

const BADGE_CONFIG: Record<BadgeTier, { classes: string; defaultLabel: string; emoji: string }> = {
  excellent: {
    classes: 'bg-amber-100 text-amber-700 border-amber-300',
    defaultLabel: 'Excellent',
    emoji: '⭐',
  },
  good: {
    classes: 'bg-blue-100 text-blue-700 border-blue-300',
    defaultLabel: 'Good',
    emoji: '👍',
  },
  'needs-practice': {
    classes: 'bg-orange-100 text-orange-700 border-orange-300',
    defaultLabel: 'Keep Trying!',
    emoji: '💪',
  },
};

export const Badge = ({ variant, label, className }: BadgeProps) => {
  const { classes, defaultLabel, emoji } = BADGE_CONFIG[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-bold',
        classes,
        className,
      )}
    >
      <span aria-hidden="true">{emoji}</span>
      {label ?? defaultLabel}
    </span>
  );
};
