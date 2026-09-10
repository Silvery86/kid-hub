'use client'

/** AnimatedNumber — a figure that counts to its new value instead of jumping. */

import { cn } from '@/lib/utils'
import { useCountUp } from '@/hooks/animation'

export interface AnimatedNumberProps {
  value: number
  /** Defaults to the `celebrate` token. */
  durationMs?: number
  /** Render the animated number — for units, currency, or a suffix. */
  format?: (value: number) => string
  className?: string
  /** Skip the count while data is still loading. */
  disabled?: boolean
}

export const AnimatedNumber = ({
  value,
  durationMs,
  format,
  className,
  disabled,
}: AnimatedNumberProps) => {
  const shown = useCountUp(value, { durationMs, disabled })
  return (
    // tabular-nums keeps the element from reflowing on every frame as digit
    // widths change, which otherwise makes a whole row jitter while counting.
    <span className={cn('tabular-nums', className)}>{format ? format(shown) : shown}</span>
  )
}
