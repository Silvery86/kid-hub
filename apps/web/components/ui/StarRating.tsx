'use client'

/** StarRating — read-only visual star rating from 1 to max stars. */

import { cn } from '@/lib/utils'
import { useStagger } from '@/hooks/animation'
import { STAGGER_LOOSE } from '@/lib/motion'

interface StarRatingProps {
  value: 1 | 2 | 3
  max?: number
  className?: string
  /** Off for a static list, where a cascade would be noise rather than reward. */
  animate?: boolean
}

export const StarRating = ({ value, max = 3, className, animate = true }: StarRatingProps) => {
  // The delays are the reward: three stars landing together is a number, three
  // stars landing one after another is an event. Stagger returns zeros under
  // reduced motion, so no branch is needed for it here.
  const delays = useStagger(max, STAGGER_LOOSE)

  return (
    <div
      className={cn('flex gap-2', className)}
      aria-label={`${value} out of ${max} stars`}
      role="img"
    >
      {Array.from({ length: max }).map((_, i) => {
        const earned = i < value
        return (
          <span
            key={i}
            className={cn(
              'text-4xl transition-colors duration-150',
              earned ? 'text-star-filled' : 'text-star-empty',
              // Only the earned ones perform. An empty slot popping in would
              // celebrate the star the child did not get.
              animate && earned && 'animate-pop-in'
            )}
            style={animate && earned && delays[i] ? { animationDelay: `${delays[i]}ms` } : undefined}
            aria-hidden="true"
          >
            ★
          </span>
        )
      })}
    </div>
  )
}
