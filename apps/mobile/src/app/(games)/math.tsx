// /math — landscape-locked Math hub. Picks a minigame, then renders it; exit returns
// to the hub, and exiting the hub pops back to the tabs. Wrapped in OrientationLock so
// the whole subject (hub + play) is landscape (Phase 5 engine).
import { useState } from 'react'
import { useRouter } from 'expo-router'
import type { MathGameType } from '@kid-hub/shared'

import { getMathBestScores } from '@/api/math.api'
import { OrientationLock } from '@/components/orientation-lock'
import { AdditionGame } from '@/components/games/addition-game'
import { CountingGame } from '@/components/games/counting-game'
import { ShapeGame } from '@/components/games/shape-game'
import { GameHub, type HubGameMeta } from '@/components/games/game-hub'

const GAMES: readonly HubGameMeta<MathGameType>[] = [
  { id: 'counting', emoji: '🌟', title: 'Đếm Sao', subtitle: 'Đếm số đồ vật (1–10)' },
  { id: 'addition', emoji: '🔢', title: 'Number Ninja', subtitle: 'Cộng & trừ nhanh' },
  { id: 'shapes', emoji: '🔷', title: 'Khám Phá Hình', subtitle: 'Nhận biết hình học' },
]

export default function MathScreen() {
  const router = useRouter()
  const [active, setActive] = useState<MathGameType | null>(null)
  const back = () => setActive(null)

  return (
    <OrientationLock mode="landscape">
      {active === 'counting' ? (
        <CountingGame onExit={back} />
      ) : active === 'addition' ? (
        <AdditionGame onExit={back} />
      ) : active === 'shapes' ? (
        <ShapeGame onExit={back} />
      ) : (
        <GameHub
          title="Toán Học 🧮"
          gameType="math"
          accent="bg-blue-600"
          games={GAMES}
          fetchBestScores={getMathBestScores}
          onSelect={setActive}
          onExit={() => router.back()}
        />
      )}
    </OrientationLock>
  )
}
