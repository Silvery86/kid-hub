'use client'

/**
 * Renders whatever celebration is currently queued, and sounds it.
 *
 * Mount once per kid-facing layout. Sound lives here rather than in the store
 * because useAudio is a hook, and because this is the component that knows a
 * celebration actually reached the screen.
 *
 * useAudio's own comment notes that it no-ops until /public/sounds/*.mp3 exist,
 * and that it silences every failure — blocked autoplay included. So this works
 * silently today and gains sound the moment the assets land, with no change.
 */

import { useEffect } from 'react'

import { useAudio } from '@/hooks/useAudio'
import { celebration, useCelebration, useReducedMotion } from '@/hooks/animation'
import { CelebrationOverlay } from './CelebrationOverlay'

export const CelebrationHost = () => {
  const current = useCelebration()
  const reduced = useReducedMotion()
  const { play } = useAudio()

  useEffect(() => {
    if (!current) return
    // Reduced motion is about motion, not sound — a child who asked for less
    // movement did not ask to stop being congratulated.
    play('complete')
  }, [current, play])

  useEffect(() => {
    if (!current) return
    // Auto-dismiss so a celebration never becomes a wall a child has to clear
    // before playing again. Long enough to read a short line; the button and a
    // tap outside both still work.
    const timer = window.setTimeout(() => celebration.next(), reduced ? 3000 : 4200)
    return () => window.clearTimeout(timer)
  }, [current, reduced])

  return <CelebrationOverlay celebration={current} onDismiss={celebration.next} />
}
