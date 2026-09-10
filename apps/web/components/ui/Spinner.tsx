/**
 * Spinner — a busy indicator small enough to sit inside a button's label.
 *
 * KidButton already has `isLoading` and renders its own, but the parent surface
 * is built from plain <button> elements sized for a dense management UI;
 * KidButton is a 4rem-tall, border-4, text-xl control built for a six-year-old's
 * thumb. Converting those call sites would have changed how every parent screen
 * looks, which is not what "show pending state" should cost.
 *
 * Colour is inherited (`border-current`), so it takes the button's own text
 * colour without being told.
 */

import { cn } from '@/lib/utils'

export interface SpinnerProps {
  /** Matches the surrounding text size. */
  size?: number
  className?: string
  /** Announced to screen readers; omit inside a button that already says it. */
  label?: string
}

export const Spinner = ({ size = 14, className, label }: SpinnerProps) => (
  <span
    role={label ? 'status' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : 'true'}
    style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 7)) }}
    className={cn(
      'inline-block shrink-0 animate-spin rounded-pill border-current border-t-transparent',
      className
    )}
  />
)
