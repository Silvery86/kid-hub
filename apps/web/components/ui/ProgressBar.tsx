'use client'

/** ProgressBar — accessible animated progress bar with colour derived from completion percentage. */

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/animation'

interface ProgressBarProps {
  value: number // Current value
  max?: number // Max value (default 100)
  className?: string
  'aria-label'?: string
  /** Fill from zero on first paint. Off for a dense list of many bars. */
  animateOnMount?: boolean
}

const getColorClass = (pct: number): string => {
  if (pct >= 90) return 'bg-progress-high'
  if (pct >= 70) return 'bg-progress-mid'
  return 'bg-progress-low'
}

export const ProgressBar = ({
  value,
  max = 100,
  className,
  'aria-label': ariaLabel,
  animateOnMount = true,
}: ProgressBarProps) => {
  const reduced = useReducedMotion()
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const fillOnMount = animateOnMount && !reduced

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
      className={cn('h-4 w-full overflow-hidden rounded-full bg-progress-track', className)}
    >
      {/* The transition already handled later changes; what was missing is the
          first paint, where the bar simply appeared at its value. growWidth runs
          once on mount and then hands back to the transition. */}
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          fillOnMount && 'animate-grow-width',
          getColorClass(pct)
        )}
        style={{ width: `${pct}%`, ...(fillOnMount ? { ['--bar-pct' as string]: `${pct}%` } : null) }}
      />
    </div>
  )
}
