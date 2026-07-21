// use-game-audio.ts — short game SFX via expo-audio (native counterpart of the
// web useAudio hook). Players are created once per screen and auto-released on
// unmount by useAudioPlayer. Every call is best-effort; failures are silenced.
import { useCallback } from 'react'
import { useAudioPlayer } from 'expo-audio'

export type SoundKey = 'correct' | 'wrong' | 'complete' | 'tap'

export function useGameAudio() {
  const correct = useAudioPlayer(require('../../assets/sounds/correct.mp3'))
  const wrong = useAudioPlayer(require('../../assets/sounds/wrong.mp3'))
  const complete = useAudioPlayer(require('../../assets/sounds/complete.mp3'))
  const tap = useAudioPlayer(require('../../assets/sounds/tap.mp3'))

  const play = useCallback(
    (key: SoundKey) => {
      const player = { correct, wrong, complete, tap }[key]
      try {
        player.seekTo(0)
        player.play()
      } catch {
        // Silently ignore — audio unavailable
      }
    },
    [correct, wrong, complete, tap]
  )

  return { play }
}
