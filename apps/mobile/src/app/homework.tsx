// Homework — web's /homework phone-portrait branch (HomeworkListView).
//
// A stack route rather than a tab, mirroring web portrait: the bottom bar caps
// at four items, so homework is reached from the dashboard's homework card.
import type { HomeworkItem } from '@kid-hub/shared'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { QueryBoundary } from '@/components/query-boundary'
import { HomeworkHeader } from '@/components/homework/homework-header'
import { HomeworkItemRow } from '@/components/homework/homework-item-row'
import { FadeSlideUp, PopIn, STAGGER_MS } from '@/components/ui/animated'
import { FullScreenModal } from '@/components/ui/full-screen-modal'
import { Screen } from '@/components/ui/screen'
import { useMarkHomeworkDone, useTodayHomework } from '@/hooks/use-homework'

/** How many pending items wear the "Ưu tiên" flag, as on web. */
const PRIORITY_COUNT = 2
/** Web lingers on the celebration for 2s before sending the kid home. */
const CELEBRATION_MS = 2000

function StatusPill({ label, tone }: { label: string; tone: 'amber' | 'emerald' }) {
  const styles =
    tone === 'amber'
      ? 'bg-tier-excellent-bg'
      : 'bg-success-bg'
  const text = tone === 'amber' ? 'text-tier-excellent-text' : 'text-success-text'
  return (
    <View className={`rounded-pill px-3 py-1 ${styles}`}>
      <Text className={`font-display-bold text-xs ${text}`}>{label}</Text>
    </View>
  )
}

export default function HomeworkScreen() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useTodayHomework()
  const markDone = useMarkHomeworkDone()
  const [showCelebration, setShowCelebration] = useState(false)

  const items: HomeworkItem[] = useMemo(() => data ?? [], [data])
  const pending = useMemo(() => items.filter((i) => !i.isDone), [items])
  const doneCount = items.length - pending.length

  const priorityIds = useMemo(
    () => new Set(pending.slice(0, PRIORITY_COUNT).map((i) => i.periodId)),
    [pending]
  )

  // Celebrate once the last item flips done, then hand back to the dashboard.
  useEffect(() => {
    if (items.length === 0 || pending.length > 0) return
    setShowCelebration(true)
    const t = setTimeout(() => {
      setShowCelebration(false)
      router.navigate('/(tabs)/dashboard')
    }, CELEBRATION_MS)
    return () => clearTimeout(t)
  }, [items.length, pending.length, router])

  if (!isLoading && !isError && items.length === 0) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Text style={{ fontSize: 80 }}>🎉</Text>
          <Text className="font-display-bold text-3xl text-text-primary">Không có bài tập!</Text>
          <Text className="font-display-semibold text-text-secondary">
            Hôm nay rảnh rỗi, chơi game nào.
          </Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen bare>
      <Stack.Screen options={{ title: 'Bài tập', headerShown: false }} />
      <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-3.5 pb-4 pt-3.5"
          showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-display-bold text-2xl text-text-primary">Bài tập 📚</Text>
            {pending.length > 0 ? (
              <StatusPill tone="amber" label={`${pending.length} chưa làm`} />
            ) : (
              <StatusPill tone="emerald" label="Xong hết!" />
            )}
          </View>

          <FadeSlideUp delay={STAGGER_MS[0]}>
            <HomeworkHeader total={items.length} done={doneCount} compact />
          </FadeSlideUp>

          <FadeSlideUp delay={STAGGER_MS[1]} className="gap-2">
            {items.map((item) => (
              <HomeworkItemRow
                key={item.periodId}
                item={item}
                compact
                isPriority={priorityIds.has(item.periodId)}
                isPending={markDone.isPending}
                onDone={() => markDone.mutate(item.periodId)}
              />
            ))}
          </FadeSlideUp>
        </ScrollView>
      </QueryBoundary>

      <FullScreenModal isOpen={showCelebration} hasCloseButton={false}>
        <View className="flex-1 items-center justify-center bg-white/90">
          <PopIn className="items-center">
            <Text className="mb-4" style={{ fontSize: 80 }}>
              🎉
            </Text>
            <Text className="font-display-bold text-4xl text-text-primary">Xong hết rồi!</Text>
            <Text className="mt-2 text-xl text-text-secondary">Giỏi lắm! ⭐</Text>
          </PopIn>
        </View>
      </FullScreenModal>
    </Screen>
  )
}
