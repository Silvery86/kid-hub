'use client'

/** GamesHubView — /games launcher for math and english suites (5 viewports). */

import { useEffect, useMemo, useState } from 'react'
import { ComingSoonCard } from '@/components/games/ComingSoonCard'
import { GameSectionCard } from '@/components/games/GameSectionCard'
import { GameStatsBar } from '@/components/games/GameStatsBar'
import { useUserProgress } from '@/hooks/useUserProgress'
import {
  COMING_SOON_GAMES,
  GAME_SECTION_DEFINITIONS,
  STARS_PER_MINIGAME,
  TOTAL_MINIGAMES,
} from '@/lib/data/games-hub'
import type { GameBestScore, UserProgress } from '@/types'

const EMPTY_PROGRESS: Pick<UserProgress, 'totalPoints' | 'currentStreak' | 'earnedBadges' | 'bestScores'> =
  {
    totalPoints: 0,
    currentStreak: 0,
    earnedBadges: [],
    bestScores: [],
  }

function getBestStars(bestScores: GameBestScore[], gameType: 'math' | 'english', subType: string): number {
  return (
    bestScores.find((b) => b.gameType === gameType && b.subType === subType)?.starsEarned ?? 0
  )
}

function buildSections(progress: UserProgress['bestScores']) {
  return GAME_SECTION_DEFINITIONS.map((sec) => {
    const games = sec.games.map((g) => ({
      ...g,
      best: getBestStars(progress, sec.id, g.id),
    }))
    const totalStars = games.reduce((sum, g) => sum + g.best, 0)
    const maxStars = games.length * STARS_PER_MINIGAME
    return { ...sec, games, totalStars, maxStars }
  })
}

export const GamesHubView = () => {
  const { progress } = useUserProgress()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const display = mounted ? progress : { ...progress, ...EMPTY_PROGRESS }
  const sections = useMemo(() => buildSections(display.bestScores), [display.bestScores])

  const totalStarsEarned = useMemo(
    () => sections.reduce((sum, s) => sum + s.totalStars, 0),
    [sections]
  )
  const maxStars = TOTAL_MINIGAMES * STARS_PER_MINIGAME
  const badgesEarned = display.earnedBadges.filter((b) => b.isEarned).length

  const statsProps = {
    points: display.totalPoints,
    streak: display.currentStreak,
    starsEarned: totalStarsEarned,
    starsMax: maxStars,
    badges: badgesEarned,
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-shell-kid portrait:overflow-y-auto">
      {/* Phone portrait */}
      <div className="hidden min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-3.5 pb-4 pt-3.5 portrait:max-md:flex">
        <GamesHeader compact subtitle="Học mà chơi · chơi mà học!" />
        <GameStatsBar {...statsProps} compact />
        <div className="flex flex-col gap-3.5">
          {sections.map((sec) => (
            <GameSectionCard key={sec.id} {...sec} compact />
          ))}
        </div>
        <ComingSoonSection compact />
      </div>

      {/* Tablet portrait */}
      <div className="hidden min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6 md:portrait:flex portrait:max-md:hidden">
        <div className="flex items-end justify-between gap-4">
          <GamesHeader subtitle="Học mà chơi · chơi mà học!" />
          <GameStatsBar {...statsProps} compact className="shrink-0" />
        </div>
        <div className="flex flex-col gap-5">
          {sections.map((sec) => (
            <GameSectionCard key={sec.id} {...sec} />
          ))}
        </div>
        <ComingSoonSection />
      </div>

      {/* Landscape: phone L, tablet L, desktop */}
      <div className="portrait:hidden flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:mx-auto lg:w-full lg:max-w-5xl lg:gap-5 lg:p-7">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <GamesHeader
            subtitle={
              mounted
                ? `Học mà chơi · chơi mà học · Tổng ${totalStarsEarned}/${maxStars} ⭐ đã đạt`
                : 'Học mà chơi · chơi mà học!'
            }
            large
          />
          <GameStatsBar {...statsProps} compact className="lg:hidden" />
          <GameStatsBar {...statsProps} className="hidden lg:flex" />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 lg:gap-5">
          {sections.map((sec) => (
            <GameSectionCard key={sec.id} {...sec} compact />
          ))}
        </div>

        <div className="hidden shrink-0 lg:block">
          <ComingSoonSection />
        </div>
      </div>
    </div>
  )
}

function GamesHeader({
  compact = false,
  large = false,
  subtitle,
}: {
  compact?: boolean
  large?: boolean
  subtitle: string
}) {
  return (
    <div>
      <h1
        className={
          compact
            ? 'text-2xl font-black tracking-tight text-text-primary'
            : large
              ? 'text-4xl font-black tracking-tight text-text-primary'
              : 'text-3xl font-black tracking-tight text-text-primary'
        }
      >
        Trò chơi 🎮
      </h1>
      <p
        className="mt-0.5 text-xs font-bold text-text-secondary lg:text-sm"
        suppressHydrationWarning
      >
        {subtitle}
      </p>
    </div>
  )
}

function ComingSoonSection({ compact = false }: { compact?: boolean }) {
  return (
    <section>
      <h2
        className={
          compact
            ? 'mb-2 text-[13px] font-black uppercase tracking-wider text-text-muted'
            : 'mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-text-muted'
        }
      >
        Sắp ra mắt
      </h2>
      <div
        className={
          compact ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-3 gap-3 lg:gap-4'
        }
      >
        {COMING_SOON_GAMES.map((g) => (
          <ComingSoonCard key={g.id} {...g} compact={compact} />
        ))}
      </div>
    </section>
  )
}
