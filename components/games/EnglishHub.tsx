'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlphabetGame } from '@/components/games/AlphabetGame'
import { WordSafariGame } from '@/components/games/WordSafariGame'
import { SoundHuntGame } from '@/components/games/SoundHuntGame'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { GameBestScore, EnglishGameType, UserProgress } from '@/types'

type ActiveGame = EnglishGameType | null

interface EnglishHubProps {
  englishHomework: { periodId: string; homeworkNote: string } | null
}

const WATERMARK_ROT = [-8, 5, -6]
const GRADIENT_BIG = 'linear-gradient(160deg, #34d399 0%, #10b981 55%, #047857 100%)'
const GRADIENT_ROW = 'linear-gradient(110deg, #34d399 0%, #10b981 55%, #047857 100%)'
const SHADOW_BIG = '0 18px 36px -16px rgba(16,185,129,.45)'
const SHADOW_ROW = '0 14px 28px -14px rgba(16,185,129,.5)'

const GAME_META: Record<EnglishGameType, { emoji: string; title: string; description: string }> = {
  alphabet: { emoji: '🔤', title: 'Alphabet Explorer', description: 'Nhận biết chữ hoa và chữ thường' },
  vocabulary: { emoji: '🦁', title: 'Word Safari', description: 'Ghép hình ảnh và từ vựng' },
  phonics: { emoji: '🔊', title: 'Sound Hunt', description: 'Tìm từ theo âm chữ cái' },
}

const GAMES = Object.keys(GAME_META) as EnglishGameType[]

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
        <p className="text-base font-black text-amber-900">Hôm nay có bài tập Tiếng Anh!</p>
        <p className="text-sm font-bold text-amber-800">
          {note ? note : 'Hoàn thành 1 trò chơi để nộp bài.'}
        </p>
      </div>
    </div>
  )
}

interface CardProps {
  id: EnglishGameType
  emoji: string
  title: string
  description: string
  bestStars: number
  idx: number
  onClick: (id: EnglishGameType) => void
}

function EnglishGameCardBig({
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
        compact ? 'aspect-3/2 gap-1 rounded-2xl p-3' : 'aspect-4/3 min-h-tap-lg gap-2 rounded-3xl p-5'
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
            'whitespace-nowrap rounded-full bg-white font-black text-english-deep',
            compact ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs'
          )}
        >
          Chơi →
        </span>
      </div>
    </button>
  )
}

function EnglishGameCardFlat({ id, emoji, title, description, bestStars, onClick }: Omit<CardProps, 'idx'>) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      data-testid={`game-card-${id}`}
      aria-label={`Chơi ${title}`}
      className={cn(
        'relative flex w-full min-h-tap-lg touch-manipulation select-none items-center gap-2.5',
        'overflow-hidden rounded-3xl p-3.5 text-left text-white sm:p-4',
        'transition-transform duration-100 active:scale-[0.97]'
      )}
      style={{ background: GRADIENT_ROW, boxShadow: SHADOW_ROW }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 size-[90px] rounded-full bg-white/12" />
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

export const EnglishHub = ({ englishHomework }: EnglishHubProps) => {
  const router = useRouter()
  const [activeGame, setActiveGame] = useState<ActiveGame>(null)
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)
  const [progress] = useLocalStorage<UserProgress | null>(STORAGE_KEYS.USER_PROGRESS, null)
  const bestScores: GameBestScore[] = Array.isArray(progress?.bestScores) ? progress.bestScores : []

  const pendingHomework = homeworkSubmitted ? null : englishHomework

  const getBestStars = (minigame: EnglishGameType): number =>
    bestScores.find((b) => b.gameType === 'english' && b.subType === minigame)?.starsEarned ?? 0

  const totalStarsEarned = GAMES.reduce((sum, game) => sum + getBestStars(game), 0)
  const maxStars = GAMES.length * 3

  const handleExit = () => setActiveGame(null)
  const handleHomeworkSubmit = () => setHomeworkSubmitted(true)

  if (activeGame === 'alphabet') {
    return (
      <AlphabetGame
        onExit={handleExit}
        homeworkPeriodId={pendingHomework?.periodId}
        onHomeworkSubmit={handleHomeworkSubmit}
      />
    )
  }

  if (activeGame === 'vocabulary') {
    return (
      <WordSafariGame
        onExit={handleExit}
        homeworkPeriodId={pendingHomework?.periodId}
        onHomeworkSubmit={handleHomeworkSubmit}
      />
    )
  }

  if (activeGame === 'phonics') {
    return (
      <SoundHuntGame
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
        <header className="hidden shrink-0 items-center justify-between px-4 pt-3 portrait:flex">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-pill border-2 border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-text-secondary"
          >
            ← Trang chủ
          </button>
          <h1 className="text-2xl font-black text-text-primary">Tiếng Anh 🔤</h1>
          <div className="w-20" aria-hidden="true" />
        </header>

        <header className="flex shrink-0 items-center justify-between px-4 pb-1 pt-2 portrait:hidden lg:hidden">
          <div>
            <h1 className="text-base font-black text-text-primary">Tiếng Anh 🔤</h1>
            <p className="text-xs font-bold text-text-secondary">Chọn một trò chơi</p>
          </div>
          {pendingHomework ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-amber-900 md:hidden">
              🏠 Có bài tập
            </span>
          ) : null}
        </header>

        <header className="hidden shrink-0 items-end justify-between gap-4 px-6 pb-2 pt-6 lg:flex lg:px-8">
          <div>
            <h1 className="text-[32px] font-black leading-tight tracking-tight text-text-primary">
              Tiếng Anh 🔤
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

        {pendingHomework ? (
          <div className="mb-3 hidden shrink-0 px-4 portrait:block md:landscape:block md:px-6 lg:px-8">
            <HomeworkBanner note={pendingHomework.homeworkNote} />
          </div>
        ) : null}

        <section className="grid min-h-0 flex-1 grid-cols-3 items-center gap-2 px-4 pb-2 portrait:hidden lg:hidden">
          {GAMES.map((game, i) => (
            <EnglishGameCardBig
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

        <section className="hidden min-h-0 flex-1 grid-cols-3 items-center gap-[18px] px-6 pb-4 portrait:hidden lg:grid lg:mx-auto lg:w-full lg:max-w-[1000px] xl:max-w-[1100px] xl:gap-[22px]">
          {GAMES.map((game, i) => (
            <EnglishGameCardBig
              key={game}
              id={game}
              idx={i}
              {...GAME_META[game]}
              bestStars={getBestStars(game)}
              onClick={setActiveGame}
            />
          ))}
        </section>

        <section className="hidden flex-col gap-3 px-4 py-3 pb-6 portrait:flex">
          {GAMES.map((game) => (
            <EnglishGameCardFlat
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
