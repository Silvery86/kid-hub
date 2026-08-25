// Games tab — web's /games phone-portrait branch (GamesHubView).
import {
  COMING_SOON_GAMES,
  GAME_SECTION_DEFINITIONS,
  STARS_PER_MINIGAME,
  TOTAL_MINIGAMES,
  type GameBestScore,
} from '@kid-hub/shared'
import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { ComingSoonCard } from '@/components/games/coming-soon-card'
import { GameSectionCard } from '@/components/games/game-section-card'
import { GameStatsBar } from '@/components/games/game-stats-bar'
import { QueryBoundary } from '@/components/query-boundary'
import { FadeSlideUp, STAGGER_MS } from '@/components/ui/animated'
import { Screen } from '@/components/ui/screen'
import { useBestScores } from '@/hooks/use-best-scores'
import { useProgress } from '@/hooks/use-progress'

const bestStarsFor = (
  scores: GameBestScore[],
  gameType: 'math' | 'english',
  subType: string
): number => scores.find((b) => b.gameType === gameType && b.subType === subType)?.starsEarned ?? 0

export default function GamesScreen() {
  const progress = useProgress()
  const best = useBestScores()

  const sections = useMemo(
    () =>
      GAME_SECTION_DEFINITIONS.map((sec) => {
        const games = sec.games.map((g) => ({ ...g, best: bestStarsFor(best.scores, sec.id, g.id) }))
        return {
          ...sec,
          games,
          totalStars: games.reduce((sum, g) => sum + g.best, 0),
          maxStars: games.length * STARS_PER_MINIGAME,
        }
      }),
    [best.scores]
  )

  const totalStarsEarned = sections.reduce((sum, s) => sum + s.totalStars, 0)

  return (
    <Screen bare>
      <QueryBoundary
        isLoading={progress.isLoading || best.isLoading}
        isError={progress.isError || best.isError}
        onRetry={() => {
          void progress.refetch()
          best.refetch()
        }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3.5 px-3.5 pb-4 pt-3.5"
          showsVerticalScrollIndicator={false}>
          <View>
            <Text className="font-display-extrabold text-2xl text-text-primary">Trò chơi 🎮</Text>
            <Text className="mt-0.5 font-display-bold text-xs text-text-secondary">
              Học mà chơi · chơi mà học!
            </Text>
          </View>

          <GameStatsBar
            points={progress.data?.totalPoints ?? 0}
            streak={progress.data?.currentStreak ?? 0}
            starsEarned={totalStarsEarned}
            starsMax={TOTAL_MINIGAMES * STARS_PER_MINIGAME}
            badges={progress.data?.earnedBadgeIds.length ?? 0}
            compact
          />

          <FadeSlideUp delay={STAGGER_MS[0]} className="gap-3.5">
            {sections.map((sec) => (
              <GameSectionCard key={sec.id} {...sec} compact />
            ))}
          </FadeSlideUp>

          <FadeSlideUp delay={STAGGER_MS[1]}>
            <Text className="mb-2 font-display-extrabold text-[13px] uppercase text-text-muted">
              Sắp ra mắt
            </Text>
            <View className="flex-row gap-2">
              {COMING_SOON_GAMES.map((g) => (
                <ComingSoonCard key={g.id} {...g} compact />
              ))}
            </View>
          </FadeSlideUp>
        </ScrollView>
      </QueryBoundary>
    </Screen>
  )
}
