'use client'

/**
 * CelebrationOverlay — the visual half of a reward moment.
 *
 * Presentational and domain-free: it is handed a title and a glyph and knows
 * nothing about badges, streaks or games. The timing, the sound and the
 * dismissal clock belong to useCelebration.
 *
 * Under reduced motion it still renders — statically. The child is told what
 * they earned either way; only the motion is removed.
 */

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { useAnimatedMount, useReducedMotion, type Celebration } from '@/hooks/animation'
import { DURATION_BASE } from '@/lib/motion'
import { Confetti } from './Confetti'

export interface CelebrationOverlayProps {
  celebration: Celebration | null
  onDismiss: () => void
  className?: string
}

export const CelebrationOverlay = ({ celebration, onDismiss, className }: CelebrationOverlayProps) => {
  const reduced = useReducedMotion()
  const { shouldRender, state } = useAnimatedMount(celebration !== null, DURATION_BASE)
  const dialog = useRef<HTMLDivElement>(null)

  // Hold the last celebration through the exit, or the overlay empties its own
  // text one frame before it finishes leaving. Adjusted during render rather
  // than kept in a ref: reading a ref while rendering is what the compiler's
  // `react-hooks/refs` rule forbids, and this value is rendered.
  const [shown, setShown] = useState<Celebration | null>(celebration)
  if (celebration && celebration !== shown) setShown(celebration)

  useEffect(() => {
    if (!shouldRender) return
    dialog.current?.focus()
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shouldRender, onDismiss])

  if (!shouldRender || !shown) return null

  const { title, description, icon = '🏅', intensity = 'big' } = shown
  const leaving = state === 'exiting'

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 grid place-items-center bg-shell-dark/45 p-6',
        !reduced && (leaving ? 'animate-pop-out' : 'animate-in fade-in'),
        className
      )}
      onClick={onDismiss}
    >
      {intensity === 'big' && !leaving ? <Confetti count={24} /> : null}

      <div
        ref={dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'relative w-full max-w-xs rounded-card bg-white p-6 text-center shadow-xl outline-none',
          !reduced && !leaving && 'animate-pop-in'
        )}
      >
        <span className="relative mx-auto mb-3 grid size-16 place-items-center">
          {!reduced && !leaving ? (
            <span
              aria-hidden="true"
              className="animate-ping-ring absolute inset-0 rounded-pill border-4 border-tier-excellent-border"
            />
          ) : null}
          <span className="grid size-16 place-items-center rounded-pill border-4 border-tier-excellent-border bg-surface-warn text-3xl">
            {icon}
          </span>
        </span>

        <p className="text-lg font-black text-text-primary">{title}</p>
        {description ? <p className="mt-1 text-sm font-bold text-text-secondary">{description}</p> : null}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 min-h-11 w-full rounded-button bg-btn-primary px-4 font-black text-white hover:bg-btn-primary-hover"
        >
          Tuyệt vời!
        </button>
      </div>
    </div>
  )
}
