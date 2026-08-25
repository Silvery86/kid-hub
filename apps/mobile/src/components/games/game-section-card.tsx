// game-section-card.tsx — web's games/GameSectionCard.tsx.
//
// The catalogue's gradient stops feed expo-linear-gradient directly; web builds
// the same stops into a CSS string via cssLinearGradient(). Web's 140deg maps to
// a top-left → bottom-right sweep, which is what start/end express here.

import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'

import { coloredShadow } from '@/lib/shadows'
import { PressableScale } from '@/components/ui/animated'

export interface GameSectionCardGame {
  id: string
  emoji: string
  name: string
  best: number
}

interface GameSectionCardProps {
  label: string
  emoji: string
  color: string
  colorDark: string
  gradientStops: readonly string[]
  desc: string
  href: '/math' | '/english'
  totalStars: number
  maxStars: number
  games: GameSectionCardGame[]
  compact?: boolean
}

export function GameSectionCard({
  label,
  emoji,
  color,
  colorDark,
  gradientStops,
  desc,
  href,
  totalStars,
  maxStars,
  games,
  compact = false,
}: GameSectionCardProps) {
  const router = useRouter()
  const pct = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0

  return (
    <PressableScale
      onPress={() => router.navigate(href)}
      accessibilityRole="button"
      accessibilityLabel={`Vào chơi ${label}`}
      testID={`game-section-${href.replace('/', '')}`}
      className={`min-h-tap w-full overflow-hidden ${compact ? 'rounded-card' : 'rounded-hero'}`}
      style={coloredShadow(color, 'xl', 0.45)}>
      <LinearGradient
        colors={[...gradientStops] as [string, string, ...string[]]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: compact ? 16 : 20, gap: compact ? 8 : 12 }}>
        {/* Rotated watermark, as on web. */}
        <Text
          className="absolute -right-5 -top-5"
          style={{ fontSize: compact ? 110 : 140, opacity: 0.15, transform: [{ rotate: '-8deg' }] }}>
          {emoji}
        </Text>

        <View className="flex-row items-center gap-2.5">
          <View
            className={`items-center justify-center rounded-button bg-white/20 ${compact ? 'h-11 w-11' : 'h-14 w-14'}`}>
            <Text style={{ fontSize: compact ? 24 : 30 }}>{emoji}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className={`font-display-extrabold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>
              {label}
            </Text>
            <Text
              className={`mt-0.5 font-display-bold text-white/85 ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
              {desc}
            </Text>
          </View>
          <View className={`rounded-pill bg-white ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
            <Text
              className={`font-display-extrabold ${compact ? 'text-[11px]' : 'text-[13px]'}`}
              style={{ color: colorDark }}>
              Vào chơi →
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          {games.map((g) => (
            <View key={g.id} className="min-w-0 flex-1 gap-1 rounded-chip bg-white/15 px-2.5 py-2">
              <Text style={{ fontSize: compact ? 18 : 22 }}>{g.emoji}</Text>
              <Text
                numberOfLines={1}
                className={`font-display-extrabold text-white ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {g.name}
              </Text>
              <View className="flex-row gap-0.5">
                {[1, 2, 3].map((i) => (
                  <Text
                    key={i}
                    className={i <= g.best ? 'text-star-filled' : 'text-white/30'}
                    style={{ fontSize: compact ? 10 : 12 }}>
                    ★
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="font-display-extrabold text-[11px] text-white/85">
              {totalStars} / {maxStars} ⭐
            </Text>
            <Text className="font-display-extrabold text-[11px] text-white/85">{pct}%</Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-pill bg-white/25">
            <View className="h-full rounded-pill bg-white" style={{ width: `${pct}%` }} />
          </View>
        </View>
      </LinearGradient>
    </PressableScale>
  )
}
