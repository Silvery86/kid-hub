// Dashboard tab — web's /dashboard (DashboardView).
//
// Two deliberate differences from web:
//  • Points, streak and badges come from GET /api/v1/progress rather than web's
//    localStorage-backed useUserProgress, so the numbers survive a reinstall.
//  • The hero paints subject.color from the shared catalogue instead of web's
//    `var(--color-{subjectId})`, which resolves to nothing for the subjects that
//    have no colour token (ethics, music …).
import {
  DAY_LABELS,
  formatDayTimeRange,
  getIsoWeekNumber,
  getSubjectById,
  getTodayDDMM,
  schoolPeriodsOnly,
  tokens,
  type ClassPeriod,
  type DayOfWeek,
} from '@kid-hub/shared'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { DayRail } from '@/components/dashboard/day-rail'
import { GameEntryCard } from '@/components/games/game-entry-card'
import { FadeSlideUp, PressableScale, STAGGER_MS } from '@/components/ui/animated'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Screen } from '@/components/ui/screen'
import { useAuth } from '@/hooks/use-auth'
import { useKidProfile } from '@/hooks/use-profile'
import { useNow } from '@/hooks/use-now'
import { useProgress } from '@/hooks/use-progress'
import { useSchedule } from '@/hooks/use-schedule'
import { useTodayHomework } from '@/hooks/use-homework'

const JS_DAY_TO_DOW: Record<number, DayOfWeek> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':')
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)
}

/** Watermark emoji behind the hero, keyed off the running subject. */
const heroWatermark = (subjectId: string): string =>
  subjectId === 'math' ? '🔢' : subjectId === 'english' ? '🔤' : '📘'

export default function DashboardScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const now = useNow()
  const profile = useKidProfile()
  const progress = useProgress()
  const schedule = useSchedule()
  const homework = useTodayHomework()

  const kidName = profile.data?.name ?? 'bạn'
  const periods = useMemo<ClassPeriod[]>(() => schedule.data?.schoolPeriods ?? [], [schedule.data])
  const eveningBlocks = useMemo<ClassPeriod[]>(
    () => schedule.data?.eveningBlocks ?? [],
    [schedule.data]
  )
  const schoolPeriods = useMemo(() => schoolPeriodsOnly(periods), [periods])
  const homeworkItems = useMemo(() => homework.data ?? [], [homework.data])
  const pendingHomeworkCount = homeworkItems.filter((i) => !i.isDone).length

  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : null
  const currentPeriod = useMemo(
    () =>
      nowMinutes == null
        ? null
        : (schoolPeriods.find(
            (p) => nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime)
          ) ?? null),
    [schoolPeriods, nowMinutes]
  )
  const nextPeriod = useMemo(
    () =>
      nowMinutes == null
        ? null
        : (schoolPeriods.find((p) => toMinutes(p.startTime) > nowMinutes) ?? null),
    [schoolPeriods, nowMinutes]
  )

  const currentSubject = currentPeriod ? getSubjectById(currentPeriod.subjectId) : null
  const nextSubject = nextPeriod ? getSubjectById(nextPeriod.subjectId) : null

  const periodProgress =
    currentPeriod && nowMinutes != null
      ? (nowMinutes - toMinutes(currentPeriod.startTime)) /
        (toMinutes(currentPeriod.endTime) - toMinutes(currentPeriod.startTime))
      : null
  const minutesLeft =
    currentPeriod && nowMinutes != null ? toMinutes(currentPeriod.endTime) - nowMinutes : null

  // Weekday · date · clock · ISO week. Null until the clock is known.
  const headerSubtitle = useMemo(() => {
    if (!now) return ''
    const dow = JS_DAY_TO_DOW[now.getDay()]
    if (!dow) return ''
    const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return `${DAY_LABELS[dow]} ${getTodayDDMM()} · ${clock} · Tuần ${getIsoWeekNumber(now)}`
  }, [now])

  // A day off reads differently from a finished day.
  const idleHero = useMemo(() => {
    if (!now) return { emoji: '⏳', title: 'Đang tải lịch…', subtitle: '' }
    if (nextPeriod) {
      return {
        emoji: '☕',
        title: 'Đang nghỉ giữa giờ',
        subtitle: `${nextSubject?.name ?? 'Tiết tiếp theo'} bắt đầu lúc ${nextPeriod.startTime}`,
      }
    }
    if (periods.length === 0) {
      return {
        emoji: '🌤️',
        title: 'Hôm nay được nghỉ!',
        subtitle:
          eveningBlocks.length > 0
            ? 'Không có tiết ở trường — chỉ có buổi học thêm tối nay.'
            : 'Hôm nay không có lịch học.',
      }
    }
    return { emoji: '🎉', title: 'Học xong rồi!', subtitle: 'Hẹn gặp lại ở buổi học tiếp theo.' }
  }, [now, nextPeriod, nextSubject, periods.length, eveningBlocks.length])

  const heroColor = currentSubject?.color ?? tokens.colors['btn-primary']
  const earnedBadgeIds = progress.data?.earnedBadgeIds ?? []

  const nextUpChip =
    nextPeriod && nextSubject ? (
      <View className="mt-4 flex-row items-center gap-2 self-start rounded-chip bg-white/20 px-3 py-2">
        <Text className="font-display-bold text-xs uppercase text-white/80">Tiếp theo</Text>
        <Text className="font-display-bold text-sm text-white">{nextSubject.name}</Text>
        <Text className="font-display-semibold text-xs text-white/85">{nextPeriod.startTime}</Text>
      </View>
    ) : null

  return (
    <Screen bare>
      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-3" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          <View className="min-w-0">
            <Text className="font-display-bold text-3xl text-text-primary">Chào {kidName}!</Text>
            <Text className="mt-1 min-h-5 font-display-semibold text-base text-text-secondary">
              {headerSubtitle}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View className="flex-row items-center gap-1.5 rounded-pill bg-tier-excellent-bg px-4 py-1.5">
              <Text>🪙</Text>
              <Text className="font-display-bold text-base text-tier-excellent-text">
                {progress.data?.totalPoints ?? 0} điểm
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-pill bg-tier-practice-bg px-3 py-1.5">
              <Text>🔥</Text>
              <Text className="font-display-bold text-sm text-tier-practice-text">
                {progress.data?.currentStreak ?? 0} ngày
              </Text>
            </View>
            <PressableScale
              onPress={() => router.navigate('/unlock')}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 rounded-pill bg-white px-3 py-1.5">
              <Text>🏆</Text>
              <Text className="font-display-bold text-sm text-text-secondary">
                {earnedBadgeIds.length} huy hiệu
              </Text>
            </PressableScale>
          </View>
        </View>

        {/* Hero */}
        <FadeSlideUp className="overflow-hidden rounded-hero" style={{ backgroundColor: heroColor }}>
          {/* Web's radial highlight; a soft diagonal linear gradient is the closest RN equivalent. */}
          <LinearGradient
            colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 0.9 }}
            style={{ position: 'absolute', inset: 0 }}
          />
          <View className="p-5">
            {currentPeriod && currentSubject ? (
              <>
                <View className="flex-row items-center gap-2">
                  <View className="h-3 w-3 rounded-pill bg-white" />
                  <Text className="font-display-bold text-xs uppercase text-white/85">
                    Đang học - Tiết {currentPeriod.periodNumber}
                  </Text>
                </View>
                <Text className="mt-2 font-display-bold text-4xl text-white">
                  {currentSubject.name}
                </Text>
                <Text className="mt-2 font-display-bold text-base text-white/90">
                  {currentPeriod.startTime} – {currentPeriod.endTime}
                  {minutesLeft != null ? `  · còn ${minutesLeft} phút` : ''}
                </Text>
                {periodProgress != null ? (
                  <View className="mt-4 h-2 overflow-hidden rounded-pill bg-white/30">
                    <View
                      className="h-full rounded-pill bg-white"
                      style={{ width: `${Math.round(periodProgress * 100)}%` }}
                    />
                  </View>
                ) : null}
                {nextUpChip}
                <Text
                  className="absolute -bottom-6 -right-4 opacity-15"
                  style={{ fontSize: 120 }}>
                  {heroWatermark(currentSubject.id)}
                </Text>
              </>
            ) : (
              <>
                <View className="min-h-40 flex-row items-center justify-center gap-4">
                  <Text style={{ fontSize: 60 }}>{idleHero.emoji}</Text>
                  <View className="min-w-0 flex-1">
                    <Text className="font-display-bold text-3xl text-white">{idleHero.title}</Text>
                    {idleHero.subtitle ? (
                      <Text className="mt-1 font-display-semibold text-sm text-white/85">
                        {idleHero.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {nextUpChip}
              </>
            )}
          </View>
        </FadeSlideUp>

        {/* Today */}
        <FadeSlideUp delay={STAGGER_MS[0]} className="rounded-card bg-white p-3" testID="dashboard-day-rail">
          <View className="mb-3 flex-row items-baseline justify-between px-0.5">
            <Text className="font-display-bold text-lg text-text-primary">Hôm nay</Text>
            {schoolPeriods.length > 0 ? (
              <View className="flex-row items-center gap-2">
                <View className="rounded-pill bg-shell-light px-2.5 py-0.5">
                  <Text className="font-display-bold text-xs text-text-muted">
                    {schoolPeriods.length} tiết
                  </Text>
                </View>
                <Text className="font-display-semibold text-xs text-text-muted">
                  {formatDayTimeRange(periods)}
                </Text>
              </View>
            ) : (
              <Text className="font-display-semibold text-xs text-text-muted">
                {eveningBlocks.length > 0 ? `${eveningBlocks.length} buổi tối` : 'Không có tiết học'}
              </Text>
            )}
          </View>

          {schoolPeriods.length > 0 ? (
            <DayRail
              periods={periods}
              currentPeriodNumber={currentPeriod?.periodNumber ?? null}
              progress={periodProgress}
            />
          ) : eveningBlocks.length === 0 ? (
            <Text className="py-4 text-center font-display-semibold text-sm text-text-muted">
              Hôm nay không có lịch học.
            </Text>
          ) : null}

          {eveningBlocks.length > 0 ? (
            <View className={schoolPeriods.length > 0 ? 'mt-3 border-t border-surface-muted pt-3' : ''}>
              <Text className="mb-2 font-display-bold text-[10px] uppercase text-text-muted">
                Học thêm buổi tối
              </Text>
              <View className="gap-2">
                {eveningBlocks.map((blk, i) => {
                  const subj = getSubjectById(blk.subjectId)
                  return (
                    <View
                      key={blk.id ?? i}
                      className="flex-row items-center gap-2.5 rounded-chip bg-shell-light px-3 py-2">
                      <Text style={{ fontSize: 16 }}>{subj?.icon ?? '📚'}</Text>
                      <Text className="flex-1 font-display-semibold text-sm text-text-primary">
                        {subj?.name ?? blk.subjectId}
                      </Text>
                      <Text className="font-display-semibold text-xs text-text-muted">
                        {blk.startTime}–{blk.endTime}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          ) : null}
        </FadeSlideUp>

        {/* Games */}
        <FadeSlideUp delay={STAGGER_MS[1]} className="rounded-card bg-white p-3">
          <Text className="mb-3 font-display-bold text-lg text-text-primary">Trò chơi 🎮</Text>
          <View className="gap-3">
            <GameEntryCard
              title="Number Ninja"
              description="Toán cộng và trừ"
              emoji="🔢"
              href="/math"
              colorClass="bg-math"
              bestStars={progress.data?.mathBestStars ?? null}
            />
            <GameEntryCard
              title="Word Explorer"
              description="Tiếng Anh vui"
              emoji="🔤"
              href="/english"
              colorClass="bg-english"
              bestStars={progress.data?.englishBestStars ?? null}
            />
          </View>
        </FadeSlideUp>

        {/* Homework preview — tapping the header opens the full list. */}
        <FadeSlideUp delay={STAGGER_MS[2]} className="rounded-card bg-white p-3">
          <PressableScale
            onPress={() => router.navigate('/homework')}
            accessibilityRole="button"
            accessibilityLabel="Mở danh sách bài tập"
            className="mb-2 flex-row items-center justify-between">
            <Text className="font-display-bold text-lg text-text-primary">Bài tập →</Text>
            <View className="flex-row items-center gap-2">
              {homeworkItems.length === 0 ? (
                <Text className="font-display-bold text-xs text-text-muted">Chưa giao</Text>
              ) : (
                <>
                  <ProgressRing
                    value={homeworkItems.length - pendingHomeworkCount}
                    max={homeworkItems.length}
                    size={22}
                  />
                  <Text
                    className={`font-display-bold text-xs ${
                      pendingHomeworkCount === 0 ? 'text-success-strong' : 'text-tier-excellent-text'
                    }`}>
                    {pendingHomeworkCount === 0 ? 'Xong!' : `${pendingHomeworkCount} chưa làm`}
                  </Text>
                </>
              )}
            </View>
          </PressableScale>

          <View className="gap-2">
            {homeworkItems.length === 0 ? (
              <Text className="py-6 text-center font-display-semibold text-sm text-text-muted">
                Hôm nay không có bài tập.
              </Text>
            ) : (
              homeworkItems.map((hw) => {
                const subject = getSubjectById(hw.subjectId)
                return (
                  <View
                    key={hw.periodId}
                    className={`flex-row items-center gap-2 rounded-chip px-2.5 py-2 ${
                      hw.isDone ? 'bg-surface-muted' : 'bg-surface-warn'
                    }`}>
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-white">
                      <Text style={{ fontSize: 18 }}>{heroWatermark(subject?.id ?? '')}</Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text
                        numberOfLines={1}
                        className={`font-display-bold text-sm ${
                          hw.isDone ? 'text-text-muted line-through' : 'text-text-primary'
                        }`}>
                        {hw.homeworkNote}
                      </Text>
                      <Text className="font-display-semibold text-[11px] text-text-muted">
                        {subject?.name ?? hw.subjectId}
                      </Text>
                    </View>
                    <View
                      className={`h-5 w-5 rounded-pill border-2 ${
                        hw.isDone
                          ? 'border-progress-complete bg-progress-complete'
                          : 'border-btn-ghost-border bg-white'
                      }`}
                    />
                  </View>
                )
              })
            )}
          </View>
        </FadeSlideUp>
        {/* No web counterpart — web signs out from the parent area, which mobile
            does not have until Phase 6, and this is the only way back to login. */}
        <PressableScale
          onPress={signOut}
          accessibilityRole="button"
          testID="sign-out"
          className="mt-2 items-center rounded-pill border border-btn-ghost-border py-3">
          <Text className="font-display-semibold text-vietnamese">Đăng xuất</Text>
        </PressableScale>
      </ScrollView>
    </Screen>
  )
}
