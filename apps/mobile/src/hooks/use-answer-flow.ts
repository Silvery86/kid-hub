// use-answer-flow.ts — the tap→feedback→advance cycle shared by all minigame views.
// Locks input, shows correct/wrong tint for INPUT_THROTTLE_MS, plays the SFX, then
// advances the shared session. Mirrors the web game components' handleAnswer.
import { useCallback, useState } from 'react'
import type { MutableRefObject } from 'react'
import { INPUT_THROTTLE_MS } from '@kid-hub/shared'

import type { SoundKey } from '@/hooks/use-game-audio'

export type Feedback = 'idle' | 'correct' | 'wrong'

export function useAnswerFlow({
  isProcessing,
  play,
  answerCorrect,
  answerWrong,
}: {
  isProcessing: MutableRefObject<boolean>
  play: (key: SoundKey) => void
  answerCorrect: () => void
  answerWrong: () => void
}) {
  const [selected, setSelected] = useState<string | number | null>(null)
  const [feedback, setFeedback] = useState<Feedback>('idle')

  const submit = useCallback(
    (key: string | number, isCorrect: boolean) => {
      if (isProcessing.current) return
      isProcessing.current = true
      setSelected(key)
      setFeedback(isCorrect ? 'correct' : 'wrong')
      play(isCorrect ? 'correct' : 'wrong')
      setTimeout(() => {
        setSelected(null)
        setFeedback('idle')
        if (isCorrect) answerCorrect()
        else answerWrong()
        isProcessing.current = false
      }, INPUT_THROTTLE_MS)
    },
    [isProcessing, play, answerCorrect, answerWrong]
  )

  const reset = useCallback(() => {
    setSelected(null)
    setFeedback('idle')
  }, [])

  return { selected, feedback, submit, reset }
}
