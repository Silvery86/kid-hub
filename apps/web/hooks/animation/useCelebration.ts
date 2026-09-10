'use client'

/**
 * The one place a "something wonderful happened" moment is assembled.
 *
 * A toast is for "your action completed". This is for a reward: it owns the
 * sound and the dismissal clock, and hands the visuals to <CelebrationOverlay>.
 * Keeping the two apart means a caller can celebrate without importing any
 * markup, and the overlay stays a presentational component with no timers.
 *
 * Sound reuses hooks/useAudio.ts rather than adding an audio layer. That hook
 * silences every failure and no-ops while /public/sounds/*.mp3 are absent, so
 * celebration works silently today and gains sound the moment assets land —
 * with no change here.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { useAudio } from '@/hooks/useAudio'
import { useReducedMotion } from './useReducedMotion'

export interface Celebration {
  title: string
  description?: string
  /** An emoji or short glyph. The overlay does not interpret it. */
  icon?: string
  /** `big` earns confetti; `small` is a quieter acknowledgement. */
  intensity?: 'small' | 'big'
}

export interface UseCelebration {
  celebration: Celebration | null
  celebrate: (input: Celebration) => void
  dismiss: () => void
  /** Exposed so a caller can render a static variant without asking twice. */
  reducedMotion: boolean
}

/** Long enough to read a short line and register the badge, short enough not to trap. */
const AUTO_DISMISS_MS = 4200

export const useCelebration = (): UseCelebration => {
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const reducedMotion = useReducedMotion()
  const { play } = useAudio()
  const timer = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const dismiss = useCallback(() => {
    clear()
    setCelebration(null)
  }, [clear])

  const celebrate = useCallback(
    (input: Celebration) => {
      clear()
      setCelebration(input)
      play('complete')
      timer.current = window.setTimeout(() => setCelebration(null), AUTO_DISMISS_MS)
    },
    [clear, play]
  )

  useEffect(() => clear, [clear])

  return { celebration, celebrate, dismiss, reducedMotion }
}
