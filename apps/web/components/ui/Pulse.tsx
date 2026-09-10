'use client'

/** Pulse — draws the eye to something live: a streak, a countdown, a new item. */

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/animation'

export interface PulseProps {
  children: ReactNode
  /** Off by default so a caller can bind it to a condition without branching. */
  active?: boolean
  /** `ring` expands a halo outward; `float` bobs gently; `beat` scales. */
  variant?: 'ring' | 'float' | 'beat'
  className?: string
}

export const Pulse = ({ children, active = true, variant = 'ring', className }: PulseProps) => {
  const reduced = useReducedMotion()
  const on = active && !reduced

  if (variant === 'ring') {
    return (
      <span className={cn('relative inline-grid place-items-center', className)}>
        {on ? (
          <span
            aria-hidden="true"
            className="animate-ping-ring absolute inset-0 rounded-pill border-2 border-current opacity-60"
          />
        ) : null}
        <span className="relative">{children}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-block',
        on && (variant === 'float' ? 'animate-float' : 'animate-count-pulse'),
        className
      )}
    >
      {children}
    </span>
  )
}
