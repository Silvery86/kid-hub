'use client'

/**
 * Whether the viewer asked for reduced motion — the single JS authority.
 *
 * The CSS guard in globals.css already neutralises every animation and
 * transition declared in stylesheets. It cannot reach motion driven from JS:
 * useCountUp would still tick, <Confetti> would still spawn nodes, and each
 * frame would merely be instant — which for a celebration is a jump-cut, worse
 * than either honest option. Every JS-driven primitive checks this hook and
 * takes the degraded-but-complete path instead.
 *
 * The principle, in one line: reduced motion removes the motion, never the
 * message.
 */

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const subscribe = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const list = window.matchMedia(QUERY)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

const getSnapshot = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(QUERY).matches
}

/**
 * The server cannot know the viewer's setting, and answering "reduced" there
 * would flip to "not reduced" on hydration and fire an entrance nobody asked
 * for. Answering "not reduced" is safe: CSS motion is already handled by the
 * media query without JS, and JS motion cannot run before hydration anyway.
 */
const getServerSnapshot = (): boolean => false

export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
