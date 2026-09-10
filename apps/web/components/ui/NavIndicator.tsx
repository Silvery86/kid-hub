'use client'

/**
 * NavIndicator — the sliding pill behind an active nav item.
 *
 * Assumes equal-width slots, which is what ParentBottomNav and every tab bar in
 * the app use. Offsetting by a whole multiple of the indicator's own width means
 * no measurement, no resize listener, and correct behaviour the first frame.
 */

import { cn } from '@/lib/utils'
import { indicatorOffset, DURATION_SLOW } from '@/lib/motion'
import { useReducedMotion } from '@/hooks/animation'

export interface NavIndicatorProps {
  activeIndex: number
  /** Number of equal slots in the bar. */
  count: number
  className?: string
}

export const NavIndicator = ({ activeIndex, count, className }: NavIndicatorProps) => {
  const reduced = useReducedMotion()
  if (count <= 0) return null

  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-y-0 left-0 rounded-chip', className)}
      style={{
        width: `${100 / count}%`,
        transform: indicatorOffset(activeIndex, count),
        transition: reduced ? undefined : `transform ${DURATION_SLOW}ms var(--ease-spring)`,
      }}
    />
  )
}
