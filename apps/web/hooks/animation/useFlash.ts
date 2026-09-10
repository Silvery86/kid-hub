'use client'

/**
 * True briefly after `key` changes — a transient "this just saved" highlight.
 *
 * Serves the week-grid cell flash and the grade-save flash. Deliberately keyed
 * rather than imperative, so a re-render caused by fresh server data lights the
 * right row without the caller tracking anything.
 *
 * Never fires on first render: arriving on a page is not a change.
 *
 * The change is detected by adjusting state during render — the pattern React
 * documents for "a component wants to reset when a prop changes" — rather than
 * setting state inside an effect, which schedules a second render pass for
 * something already known during the first.
 */

import { useEffect, useState } from 'react'

import { DURATION_CELEBRATE } from '@/lib/motion'
import { useReducedMotion } from './useReducedMotion'

export const useFlash = (key: unknown, ms: number = DURATION_CELEBRATE): boolean => {
  const reduced = useReducedMotion()
  const [state, setState] = useState<{ key: unknown; on: boolean }>({ key, on: false })

  if (!Object.is(state.key, key)) {
    setState({ key, on: !reduced })
  }

  useEffect(() => {
    if (!state.on) return
    const timer = window.setTimeout(() => setState((s) => ({ ...s, on: false })), ms)
    return () => window.clearTimeout(timer)
  }, [state.on, ms])

  return state.on
}
