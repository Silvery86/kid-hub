// use-game-audio.ts — short game SFX via expo-audio (native counterpart of the
// web useAudio hook).
//
// Like expo-screen-orientation, expo-audio's native side only exists in a build
// made after its config plugin was added, and importing it at module scope on an
// older binary throws while the module is evaluating — taking the whole route
// tree down with it. So the package is loaded defensively and every call no-ops
// when it is missing: games stay playable, just silent, until the device takes a
// new build. Every call is best-effort; failures are silenced.
import { useCallback, useEffect, useRef } from 'react'

type AudioModule = typeof import('expo-audio')
type AudioPlayer = ReturnType<AudioModule['createAudioPlayer']>

const native: AudioModule | null = (() => {
  try {
    return require('expo-audio') as AudioModule
  } catch {
    return null
  }
})()

export type SoundKey = 'correct' | 'wrong' | 'complete' | 'tap'

// Static requires: these are Metro assets, not native modules — always safe.
const SOURCES: Record<SoundKey, number> = {
  correct: require('../../assets/sounds/correct.mp3'),
  wrong: require('../../assets/sounds/wrong.mp3'),
  complete: require('../../assets/sounds/complete.mp3'),
  tap: require('../../assets/sounds/tap.mp3'),
}

export function useGameAudio() {
  const playersRef = useRef<Partial<Record<SoundKey, AudioPlayer>>>({})

  useEffect(() => {
    if (!native) return
    const players: Partial<Record<SoundKey, AudioPlayer>> = {}
    for (const key of Object.keys(SOURCES) as SoundKey[]) {
      try {
        players[key] = native.createAudioPlayer(SOURCES[key])
      } catch {
        // Silently ignore — this sound is unavailable.
      }
    }
    playersRef.current = players

    // createAudioPlayer is imperative, so release explicitly on unmount.
    return () => {
      for (const player of Object.values(players)) {
        try {
          player?.remove()
        } catch {
          // Ignore — already released.
        }
      }
      playersRef.current = {}
    }
  }, [])

  const play = useCallback((key: SoundKey) => {
    const player = playersRef.current[key]
    if (!player) return
    try {
      player.seekTo(0)
      player.play()
    } catch {
      // Silently ignore — audio unavailable.
    }
  }, [])

  return { play }
}
