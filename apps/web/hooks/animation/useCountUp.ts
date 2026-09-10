'use client'

/**
 * Animate a number toward a target.
 *
 * Serves every changing figure in the app — game score, parent stats, streak
 * days, screen-time, unread count. Counts down as readily as up.
 *
 * The maths lives in lib/motion.ts so it can be unit tested; this hook owns only
 * the frame loop and the reduced-motion decision.
 */

import { useEffect, useRef, useState } from 'react'

import { DURATION_CELEBRATE, countUpValue, progressOf } from '@/lib/motion'
import { useReducedMotion } from './useReducedMotion'

export interface UseCountUpOptions {
  /** Defaults to the `celebrate` token (700 ms). */
  durationMs?: number
  /** Skip the animation entirely — useful while data is still loading. */
  disabled?: boolean
}

export const useCountUp = (target: number, options: UseCountUpOptions = {}): number => {
  const { durationMs = DURATION_CELEBRATE, disabled = false } = options
  const reduced = useReducedMotion()
  const skip = disabled || reduced

  const [display, setDisplay] = useState(target)
  const origin = useRef(target)

  useEffect(() => {
    if (skip || typeof window === 'undefined') {
      // Nothing to animate; the returned value below already reports `target`,
      // so no state write is needed here — only the origin for a later run.
      origin.current = target
      return
    }

    const from = origin.current
    if (from === target) return

    let frame: number | null = null
    let start: number | null = null

    const step = (now: number): void => {
      if (start === null) start = now
      const progress = progressOf(now - start, durationMs)
      setDisplay(countUpValue(from, target, progress))
      if (progress < 1) {
        frame = window.requestAnimationFrame(step)
      } else {
        origin.current = target
        frame = null
      }
    }

    frame = window.requestAnimationFrame(step)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      origin.current = target
    }
  }, [target, durationMs, skip])

  // Reporting `target` directly while skipping keeps SSR, reduced motion and the
  // loading state on one path, and means no state write is needed to correct it.
  return skip ? target : display
}
