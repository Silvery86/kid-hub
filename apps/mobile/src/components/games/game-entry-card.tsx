// game-entry-card.tsx — web's games/GameEntryCard.tsx.

import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'

import { shadow } from '@/lib/shadows'
import { PressableScale } from '@/components/ui/animated'
import { StarRating } from '@/components/ui/star-rating'

interface GameEntryCardProps {
  title: string
  description: string
  emoji: string
  href: '/math' | '/english'
  colorClass: string
  /** Best stars earned, or null when the game has never been played. */
  bestStars?: number | null
}

export function GameEntryCard({
  title,
  description,
  emoji,
  href,
  colorClass,
  bestStars,
}: GameEntryCardProps) {
  const router = useRouter()

  return (
    <PressableScale
      onPress={() => router.navigate(href)}
      accessibilityRole="button"
      accessibilityLabel={`Chơi ${title}`}
      className={`min-h-tap-lg flex-1 gap-3 rounded-card p-5 ${colorClass}`}
      style={shadow('lg')}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <View>
        <Text className="font-display-bold text-xl text-white">{title}</Text>
        <Text className="text-sm text-white/80">{description}</Text>
      </View>
      {bestStars ? (
        <View className="flex-row items-center gap-2">
          <StarRating value={bestStars} size={20} />
          <Text className="font-display-semibold text-xs text-white/70">Kỷ lục</Text>
        </View>
      ) : (
        <Text className="font-display-semibold text-xs text-white/60">Chưa chơi</Text>
      )}
    </PressableScale>
  )
}
