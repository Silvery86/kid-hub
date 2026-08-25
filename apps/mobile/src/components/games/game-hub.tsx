// game-hub.tsx — the minigame picker for a subject (math/english). Landscape row of
// cards, each showing the best stars pulled from the server (Phase 4 GET). Native
// port of the web MathHub / EnglishHub selection grid.
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import type { GameBestScore, GameType } from '@kid-hub/shared'

import { StarRating } from '@/components/ui/star-rating'

export interface HubGameMeta<Id extends string> {
  id: Id
  emoji: string
  title: string
  subtitle: string
}

export function GameHub<Id extends string>({
  title,
  gameType,
  accent,
  games,
  fetchBestScores,
  onSelect,
  onExit,
}: {
  title: string
  gameType: GameType
  accent: string // background class for the cards, e.g. 'bg-blue-600'
  games: readonly HubGameMeta<Id>[]
  fetchBestScores: () => Promise<GameBestScore[]>
  onSelect: (id: Id) => void
  onExit: () => void
}) {
  const { data } = useQuery({ queryKey: ['best-scores', gameType], queryFn: fetchBestScores })
  const bestStars = (id: string): number =>
    data?.find((b) => b.gameType === gameType && b.subType === id)?.starsEarned ?? 0

  return (
    <View className="flex-1 bg-slate-900">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-2xl font-black text-white">{title}</Text>
        <Pressable
          onPress={onExit}
          hitSlop={8}
          className="min-h-tap justify-center rounded-full border-2 border-slate-600 px-4 py-2 active:bg-slate-800">
          <Text className="text-sm font-extrabold text-slate-300">← Trò chơi</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="flex-row flex-wrap justify-center gap-4 px-5 pb-6">
        {games.map((g, idx) => (
          <Pressable
            key={g.id}
            testID={`game-card-${g.id}`}
            accessibilityLabel={`Chơi ${g.title}`}
            onPress={() => onSelect(g.id)}
            className={
              'min-h-[160px] w-[240px] justify-between overflow-hidden rounded-3xl p-5 active:opacity-90 ' +
              accent
            }>
            <View className="flex-row items-start justify-between">
              <View className="rounded-full bg-white/20 px-3 py-1">
                <Text className="text-xs font-extrabold text-white">Trò chơi {idx + 1}</Text>
              </View>
              <Text style={{ fontSize: 36 }}>{g.emoji}</Text>
            </View>
            <View>
              <Text className="text-xl font-black text-white">{g.title}</Text>
              <Text className="mt-0.5 text-xs font-bold text-white/85">{g.subtitle}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <StarRating value={bestStars(g.id)} size={20} />
              <View className="rounded-full bg-white px-4 py-1.5">
                <Text className="text-xs font-black text-slate-900">Chơi →</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
