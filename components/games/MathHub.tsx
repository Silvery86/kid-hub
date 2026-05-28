'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CountingGame } from '@/components/games/CountingGame'
import { MathGame } from '@/components/games/MathGame'
import { ShapeGame } from '@/components/games/ShapeGame'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { GameBestScore, MathGameType, UserProgress } from '@/types'

type ActiveGame = MathGameType | null

interface MathHubProps {
  mathHomework: { periodId: string; homeworkNote: string } | null
}

const WATERMARK_ROT = [-8, 5, -6]
const GRADIENT_BIG = 'linear-gradient(160deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)'
const SHADOW_BIG = '0 18px 36px -16px rgba(37,99,235,.45)'
const SHADOW_ROW = '0 16px 32px -16px rgba(59,130,246,.5)'

const GAME_META: Record<MathGameType, { emoji: string; title: string; description: string }> = {
  counting: { emoji: '🌟', title: 'Đếm Sao', description: 'Đếm số đồ vật (1–10)' },
  addition: { emoji: '🔢', title: 'Number Ninja', description: 'Cộng & trừ trong 10' },
  shapes: { emoji: '🔷', title: 'Khám Phá Hình', description: 'Nhận biết hình học' },
}

const GAMES = Object.keys(GAME_META) as MathGameType[]

function Stars({ count, size }: { count: number; size: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(size, 'leading-none', i <= count ? 'text-amber-400' : 'text-white/30')}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function HomeworkBanner({ note }: { note?: string }) {
  return (
    <div
      data-testid="homework-banner"
      role="alert"
      className="flex items-center gap-3 rounded-[20px] bg-amber-400 px-4 py-3.5 shadow-[0_6px_16px_-8px_rgba(251,191,36,0.7)] sm:px-[18px] sm:py-3.5"
    >
      <span className="text-3xl" aria-hidden="true">
        🏠
      </span>
      <div>
        <p className="text-base font-black text-amber-900">Hôm nay có bài tập Toán!</p>
        <p className="text-sm font-bold text-amber-800">
          {note ? note : 'Hoàn thành 1 trò chơi để nộp bài.'}
        </p>
      </div>
    </div>
  )
}

interface CardProps {
  id: MathGameType
  emoji: string
  title: string
  description: string
  bestStars: number
  idx: number
  onClick: (id: MathGameType) => void
}

function MathGameCardBig({
  id,
  emoji,
  title,
  description,
  bestStars,
  idx,
  onClick,
  compact = false,
}: CardProps & { compact?: boolean }) {
  const rot = WATERMARK_ROT[idx % 3]
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      data-testid={`game-card-${id}`}
      aria-label={`Chơi ${title}`}
      className={cn(
        'relative flex w-full touch-manipulation select-none flex-col overflow-hidden text-left text-white',
        'transition-transform duration-100 active:scale-[0.97]',
        compact ? 'aspect-[3/2] gap-1 rounded-2xl p-3' : 'aspect-[4/3] min-h-tap-lg gap-2 rounded-3xl p-5'
      )}
      style={{ background: GRADIENT_BIG, boxShadow: SHADOW_BIG }}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-2 -top-2 select-none leading-none opacity-[0.18]',
          compact ? 'text-[90px]' : 'text-[170px]'
        )}
        style={{ transform: `rotate(${rot}deg)` }}
        aria-hidden="true"
      >
        {emoji}
      </div>

      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={cn(
            'rounded-full bg-white/20 font-extrabold',
            compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]'
          )}
        >
          Trò chơi {idx + 1}
        </span>
        <span aria-hidden="true" className={cn('leading-none', compact ? 'text-2xl' : 'text-4xl')}>
          {emoji}
        </span>
      </div>

      <div className="relative z-10 mt-auto">
        <div className={cn('font-black leading-tight', compact ? 'text-sm' : 'text-xl')}>{title}</div>
        {!compact && <div className="mt-0.5 text-xs font-bold text-white/85">{description}</div>}
      </div>

      <div className="relative z-10 flex items-center justify-between gap-2">
        <Stars count={bestStars} size={compact ? 'text-sm' : 'text-xl'} />
        <span
          className={cn(
            'whitespace-nowrap rounded-full bg-white font-black text-math-deep',
            compact ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs'
          )}
        >
          Chơi →
        </span>
      </div>
    </button>
  )
}

function MathGameCardFlat({ id, emoji, title, description, bestStars, onClick }: Omit<CardProps, 'idx'>) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      data-testid={`game-card-${id}`}
      aria-label={`Chơi ${title}`}
      className={cn(
        'relative flex w-full min-h-tap-lg touch-manipulation select-none items-center gap-2.5',
        'overflow-hidden rounded-3xl bg-math p-3.5 text-left text-white sm:p-4',
        'transition-transform duration-100 active:scale-[0.97]'
      )}
      style={{ boxShadow: SHADOW_ROW }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 size-[90px] rounded-full bg-white/[0.12]" />
      <div className="relative z-10 shrink-0 text-5xl leading-none sm:text-6xl" aria-hidden="true">
        {emoji}
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="text-xl font-black leading-tight sm:text-2xl">{title}</div>
        <div className="mt-1 text-xs font-bold text-white/85 sm:text-sm">{description}</div>
        <div className="mt-1.5 flex items-center gap-2">
          <Stars count={bestStars} size="text-xl sm:text-2xl" />
          <span className="text-xs font-bold text-white/70">Kỷ lục</span>
        </div>
      </div>
    </button>
  )
}

export const MathHub = ({ mathHomework }: MathHubProps) => {
  const router = useRouter()
  const [activeGame, setActiveGame] = useState<ActiveGame>(null)
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)
  const [progress] = useLocalStorage<UserProgress | null>(STORAGE_KEYS.USER_PROGRESS, null)
  const bestScores: GameBestScore[] = Array.isArray(progress?.bestScores) ? progress.bestScores : []

  const pendingHomework = homeworkSubmitted ? null : mathHomework

  const getBestStars = (minigame: MathGameType): number =>
    bestScores.find((b) => b.gameType === 'math' && b.subType === minigame)?.starsEarned ?? 0

  const totalStarsEarned = GAMES.reduce((sum, game) => sum + getBestStars(game), 0)
  const maxStars = GAMES.length * 3

  const handleExit = () => setActiveGame(null)
  const handleHomeworkSubmit = () => setHomeworkSubmitted(true)

  if (activeGame === 'counting') {
    return (
      <CountingGame
        onExit={handleExit}
        homeworkPeriodId={pendingHomework?.periodId}
        onHomeworkSubmit={handleHomeworkSubmit}
      />
    )
  }

  if (activeGame === 'addition') {
    return (
      <MathGame
        onExit={handleExit}
        homeworkPeriodId={pendingHomework?.periodId}
        onHomeworkSubmit={handleHomeworkSubmit}
      />
    )
  }

  if (activeGame === 'shapes') {
    return (
      <ShapeGame
        onExit={handleExit}
        homeworkPeriodId={pendingHomework?.periodId}
        onHomeworkSubmit={handleHomeworkSubmit}
      />
    )
  }

  return (
    <div className="flex h-dvh min-h-0 bg-shell-kid pl-24 portrait:pl-0 portrait:pb-16 lg:pl-60">
      <AppSidebar />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden portrait:overflow-y-auto">
        {/* Portrait header */}
        <header className="hidden shrink-0 items-center justify-between px-4 pt-3 portrait:flex">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-pill border-2 border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-text-secondary"
          >
            ← Trang chủ
          </button>
          <h1 className="text-2xl font-black text-text-primary">Toán Học 🧮</h1>
          <div className="w-20" aria-hidden="true" />
        </header>

        {/* Landscape / tablet — compact title row */}
        <header className="flex shrink-0 items-center justify-between px-4 pb-1 pt-2 portrait:hidden lg:hidden">
          <div>
            <h1 className="text-base font-black text-text-primary">Toán Học 🧮</h1>
            <p className="text-xs font-bold text-text-secondary">Chọn một trò chơi</p>
          </div>
          {pendingHomework ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-amber-900 md:hidden">
              🏠 Có bài tập
            </span>
          ) : null}
        </header>

        {/* Desktop header — design MathHubDesktop */}
        <header className="hidden shrink-0 items-end justify-between gap-4 px-6 pb-2 pt-6 lg:flex lg:px-8">
          <div>
            <h1 className="text-[32px] font-black leading-tight tracking-tight text-text-primary">
              Toán Học 🧮
            </h1>
            <p className="mt-1.5 text-sm font-bold text-text-secondary">
              Chọn một trò chơi nhỏ để bắt đầu · Tổng kỷ lục {totalStarsEarned}/{maxStars} ⭐
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="shrink-0 rounded-pill border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-text-primary transition-colors hover:bg-slate-50"
          >
            ← Trang chủ
          </button>
        </header>

        {/* Homework banner — portrait + desktop/tablet landscape */}
        {pendingHomework ? (
          <div className="mb-3 hidden shrink-0 px-4 portrait:block md:landscape:block md:px-6 lg:px-8">
            <HomeworkBanner note={pendingHomework.homeworkNote} />
          </div>
        ) : null}

        {/* Compact 3-col cards — phone/tablet landscape only */}
        <section className="grid min-h-0 flex-1 grid-cols-3 items-center gap-2 px-4 pb-2 portrait:hidden lg:hidden">
          {GAMES.map((game, i) => (
            <MathGameCardBig
              key={game}
              id={game}
              idx={i}
              {...GAME_META[game]}
              bestStars={getBestStars(game)}
              onClick={setActiveGame}
              compact
            />
          ))}
        </section>

        {/* Full-size 3-col cards — desktop + tablet landscape */}
        <section className="hidden min-h-0 flex-1 grid-cols-3 items-center gap-[18px] px-6 pb-4 portrait:hidden lg:grid lg:max-w-[1000px] lg:mx-auto lg:w-full xl:max-w-[1100px] xl:gap-[22px]">
          {GAMES.map((game, i) => (
            <MathGameCardBig
              key={game}
              id={game}
              idx={i}
              {...GAME_META[game]}
              bestStars={getBestStars(game)}
              onClick={setActiveGame}
            />
          ))}
        </section>

        {/* Portrait stacked cards */}
        <section className="hidden flex-col gap-3 px-4 py-3 pb-6 portrait:flex">
          {GAMES.map((game) => (
            <MathGameCardFlat
              key={game}
              id={game}
              {...GAME_META[game]}
              bestStars={getBestStars(game)}
              onClick={setActiveGame}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
