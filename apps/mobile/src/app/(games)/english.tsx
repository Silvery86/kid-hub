// /english — landscape-locked English hub. Picks a minigame, then renders it; exit
// returns to the hub, and exiting the hub pops back to the tabs. Wrapped in
// OrientationLock so the whole subject (hub + play) is landscape (Phase 5 engine).
import { useState } from 'react'
import { useRouter } from 'expo-router'
import type { EnglishGameType } from '@kid-hub/shared'

import { getEnglishBestScores } from '@/api/english.api'
import { OrientationLock } from '@/components/orientation-lock'
import { AlphabetGame } from '@/components/games/alphabet-game'
import { WordSafariGame } from '@/components/games/word-safari-game'
import { SoundHuntGame } from '@/components/games/sound-hunt-game'
import { GameHub, type HubGameMeta } from '@/components/games/game-hub'

const GAMES: readonly HubGameMeta<EnglishGameType>[] = [
  { id: 'alphabet', emoji: '🔤', title: 'Alphabet Explorer', subtitle: 'Chữ hoa và chữ thường' },
  { id: 'vocabulary', emoji: '🦁', title: 'Word Safari', subtitle: 'Ghép hình ảnh và từ vựng' },
  { id: 'phonics', emoji: '🔊', title: 'Sound Hunt', subtitle: 'Tìm từ theo âm chữ cái' },
]

export default function EnglishScreen() {
  const router = useRouter()
  const [active, setActive] = useState<EnglishGameType | null>(null)
  const back = () => setActive(null)

  return (
    <OrientationLock mode="landscape">
      {active === 'alphabet' ? (
        <AlphabetGame onExit={back} />
      ) : active === 'vocabulary' ? (
        <WordSafariGame onExit={back} />
      ) : active === 'phonics' ? (
        <SoundHuntGame onExit={back} />
      ) : (
        <GameHub
          title="Tiếng Anh 🔤"
          gameType="english"
          accent="bg-english"
          games={GAMES}
          fetchBestScores={getEnglishBestScores}
          onSelect={setActive}
          onExit={() => router.back()}
        />
      )}
    </OrientationLock>
  )
}
