'use client'

/**
 * Keep a node mounted through its exit animation.
 *
 * React unmounts the moment a condition flips, so an exit animation on a
 * conditionally-rendered node never plays — which is why FullScreenModal
 * currently enters with zoom-in-95 and vanishes instantly. This holds the node
 * for `exitMs` after `open` goes false, then releases it.
 *
 * Under reduced motion the hold is skipped: there is no exit to wait for.
 */

import { useEffect, useState } from 'react'

import { DURATION_BASE } from '@/lib/motion'
import { useReducedMotion } from './useReducedMotion'

export type MountState = 'entering' | 'entered' | 'exiting'

export interface AnimatedMount {
  /** Render the node while this is true. */
  shouldRender: boolean
  state: MountState
}

export const useAnimatedMount = (open: boolean, exitMs: number = DURATION_BASE): AnimatedMount => {
  const reduced = useReducedMotion()
  const [shouldRender, setShouldRender] = useState(open)
  const [state, setState] = useState<MountState>(open ? 'entered' : 'exiting')

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      setState('entering')
      // One frame later so the entering class is applied to a node the browser
      // has already laid out — otherwise the animation is skipped.
      const raf = window.requestAnimationFrame(() => setState('entered'))
      return () => window.cancelAnimationFrame(raf)
    }

    if (!shouldRender) return

    setState('exiting')
    if (reduced) {
      setShouldRender(false)
      return
    }

    const timer = window.setTimeout(() => setShouldRender(false), exitMs)
    return () => window.clearTimeout(timer)
    // `shouldRender` is read but deliberately not a dependency: adding it would
    // restart the exit timer on the state change the timer itself causes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exitMs, reduced])

  return { shouldRender, state }
}
