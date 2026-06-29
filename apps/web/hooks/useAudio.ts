'use client'

/** Audio hook — preloads and plays short sound effects gated by user interaction. */

import { useRef, useCallback } from 'react'

type SoundKey = 'correct' | 'wrong' | 'complete' | 'tap'

/**
 * Thin audio hook — preloads short sounds and plays them gated by user interaction.
 * All failures are silenced (private mode, blocked autoplay, missing files).
 *
 * Sound files are expected at /public/sounds/*.mp3.
 * Until real assets exist, all play() calls gracefully no-op.
 */
export const useAudio = () => {
  const audioMap = useRef<Partial<Record<SoundKey, HTMLAudioElement>>>({})
  const isInitialised = useRef(false)

  /** Call once on the first user gesture to preload audio elements. */
  const initialise = useCallback(() => {
    if (isInitialised.current || typeof window === 'undefined') return
    isInitialised.current = true

    const sounds: Record<SoundKey, string> = {
      correct: '/sounds/correct.mp3',
      wrong: '/sounds/wrong.mp3',
      complete: '/sounds/complete.mp3',
      tap: '/sounds/tap.mp3',
    }

    for (const [key, src] of Object.entries(sounds) as [SoundKey, string][]) {
      try {
        const audio = new Audio(src)
        audio.preload = 'auto'
        audioMap.current[key] = audio
      } catch {
        // Silently ignore — audio unavailable
      }
    }
  }, [])

  const play = useCallback((key: SoundKey) => {
    const audio = audioMap.current[key]
    if (!audio) return
    try {
      audio.currentTime = 0
      audio.play().catch(() => {
        // Silently ignore — missing file, blocked autoplay, or unsupported format
      })
    } catch {
      // Silently ignore blocked autoplay or missing file
    }
  }, [])

  return { initialise, play }
}
