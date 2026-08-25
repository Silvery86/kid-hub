// Badges screen — web's /unlock phone-portrait branch (BadgesView).
//
// A stack route rather than a tab, matching web portrait: the bottom bar caps at
// four items, so badges is reached from the dashboard's 🏆 pill.
//
// One data difference: web's localStorage progress records when each badge was
// earned, so it prints a date. GET /api/v1/progress returns earned ids only, so
// the card falls back to a plain "✓ Đã đạt".
import { BADGE_DEFINITIONS, BADGE_PROGRESS_HINT } from '@kid-hub/shared'
import { Stack } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { BadgeCard, type BadgeDisplayItem } from '@/components/badges/badge-card'
import { QueryBoundary } from '@/components/query-boundary'
import { FadeSlideUp, PressableScale, STAGGER_MS } from '@/components/ui/animated'
import { Screen } from '@/components/ui/screen'
import { coloredShadow } from '@/lib/shadows'
import { tokens } from '@kid-hub/shared'
import { LinearGradient } from 'expo-linear-gradient'
import { useProgress } from '@/hooks/use-progress'
import { useKidProfile } from '@/hooks/use-profile'

type BadgeFilter = 'all' | 'earned' | 'locked'

const FILTERS: { id: BadgeFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'earned', label: 'Đã đạt ✓' },
  { id: 'locked', label: 'Chưa đạt' },
]

/** Fallback completion hint for a badge with no entry in BADGE_PROGRESS_HINT. */
const DEFAULT_PROGRESS_HINT = 40

function FilterTabs({
  active,
  onChange,
}: {
  active: BadgeFilter
  onChange: (f: BadgeFilter) => void
}) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {FILTERS.map((t) => {
        const isActive = active === t.id
        return (
          <PressableScale
            key={t.id}
            onPress={() => onChange(t.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`min-h-tap justify-center rounded-pill px-3.5 py-1.5 ${isActive ? 'bg-btn-primary' : 'bg-white'}`}
            style={isActive ? coloredShadow(tokens.colors['btn-primary'], 'sm', 0.55) : undefined}>
            <Text
              className={`font-display-extrabold text-xs ${isActive ? 'text-white' : 'text-text-secondary'}`}>
              {t.label}
            </Text>
          </PressableScale>
        )
      })}
    </View>
  )
}

function BadgesSummary({
  earned,
  total,
  kidName,
}: {
  earned: number
  total: number
  kidName: string
}) {
  const stars = total > 0 ? Math.round((earned / total) * 5) : 0

  return (
    <LinearGradient
      colors={[tokens.colors['progress-high'], tokens.colors['star-filled'], '#f59e0b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: 22, padding: 12 }, coloredShadow(tokens.colors['progress-high'], 'lg', 0.5)]}>
      <View className="flex-row items-center gap-3">
        <Text style={{ fontSize: 40 }}>🏆</Text>
        <View className="min-w-0 flex-1">
          <Text className="font-display-extrabold text-[11px] uppercase text-white/85">
            Bộ sưu tập huy hiệu của {kidName}
          </Text>
          <Text className="font-display-extrabold text-2xl text-white">
            {earned} / {total}
          </Text>
          <Text className="font-display-bold text-[11px] text-white/85">huy hiệu đã đạt</Text>
        </View>
        <View className="flex-row gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Text key={i} className="text-white" style={{ fontSize: 18 }}>
              {i <= stars ? '★' : '☆'}
            </Text>
          ))}
        </View>
      </View>
    </LinearGradient>
  )
}

export default function BadgesScreen() {
  const progress = useProgress()
  const profile = useKidProfile()
  const [filter, setFilter] = useState<BadgeFilter>('all')

  const badges: BadgeDisplayItem[] = useMemo(() => {
    const earnedIds = new Set(progress.data?.earnedBadgeIds ?? [])
    return BADGE_DEFINITIONS.map((def) => {
      const isEarned = earnedIds.has(def.id)
      return {
        id: def.id,
        emoji: def.iconEmoji,
        name: def.name,
        description: def.description,
        isEarned,
        progress: isEarned
          ? undefined
          : (BADGE_PROGRESS_HINT[def.id] ?? DEFAULT_PROGRESS_HINT),
      }
    })
  }, [progress.data])

  const earnedCount = badges.filter((b) => b.isEarned).length
  const filtered = badges.filter((b) =>
    filter === 'earned' ? b.isEarned : filter === 'locked' ? !b.isEarned : true
  )

  // Two-up grid, as web's compact branch renders.
  const rows: BadgeDisplayItem[][] = []
  for (let i = 0; i < filtered.length; i += 2) rows.push(filtered.slice(i, i + 2))

  return (
    <Screen bare>
      <Stack.Screen options={{ title: 'Huy hiệu', headerShown: false }} />
      <QueryBoundary
        isLoading={progress.isLoading}
        isError={progress.isError}
        onRetry={progress.refetch}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-3.5 pb-4 pt-3.5"
          showsVerticalScrollIndicator={false}>
          <Text className="font-display-extrabold text-[22px] text-text-primary">Huy hiệu 🏆</Text>

          <FadeSlideUp delay={STAGGER_MS[0]}>
            <BadgesSummary
              earned={earnedCount}
              total={badges.length}
              kidName={profile.data?.name ?? 'bé'}
            />
          </FadeSlideUp>

          <FilterTabs active={filter} onChange={setFilter} />

          <FadeSlideUp delay={STAGGER_MS[1]} className="gap-2.5">
            {rows.map((row, i) => (
              <View key={i} className="flex-row gap-2.5">
                {row.map((b) => (
                  <BadgeCard key={b.id} badge={b} compact />
                ))}
                {row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            ))}
          </FadeSlideUp>
        </ScrollView>
      </QueryBoundary>
    </Screen>
  )
}
