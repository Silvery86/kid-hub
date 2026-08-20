/** Badge — pill-style badge indicating a grade tier (excellent, good, needs-practice). */

import { cn } from '@/lib/utils'
import type { BadgeTier } from '@/types'

interface BadgeProps {
  variant: BadgeTier
  label?: string
  className?: string
}

const BADGE_CONFIG: Record<BadgeTier, { classes: string; defaultLabel: string; emoji: string }> = {
  excellent: {
    classes: 'bg-tier-excellent-bg text-tier-excellent-text border-tier-excellent-border',
    defaultLabel: 'Excellent',
    emoji: '⭐',
  },
  good: {
    classes: 'bg-tier-good-bg text-tier-good-text border-tier-good-border',
    defaultLabel: 'Good',
    emoji: '👍',
  },
  'needs-practice': {
    classes: 'bg-tier-practice-bg text-tier-practice-text border-tier-practice-border',
    defaultLabel: 'Keep Trying!',
    emoji: '💪',
  },
}

export const Badge = ({ variant, label, className }: BadgeProps) => {
  const { classes, defaultLabel, emoji } = BADGE_CONFIG[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold',
        classes,
        className
      )}
    >
      <span aria-hidden="true">{emoji}</span>
      {label ?? defaultLabel}
    </span>
  )
}
