'use client'

/**
 * Entrance delays for a group, in order.
 *
 * Serves every list and grid that should arrive as a sequence rather than all at
 * once — dashboard cards, hub tiles, badge grid, activity feed, star ratings.
 *
 * Returns all zeros under reduced motion, so a caller that spreads these into
 * `animationDelay` needs no branch of its own.
 */

import { useMemo } from 'react'

import { STAGGER_BASE, staggerDelays } from '@/lib/motion'
import { useReducedMotion } from './useReducedMotion'

export const useStagger = (count: number, step: number = STAGGER_BASE): number[] => {
  const reduced = useReducedMotion()
  return useMemo(
    () => (reduced ? Array.from({ length: Math.max(0, count) }, () => 0) : staggerDelays(count, step)),
    [count, step, reduced]
  )
}
