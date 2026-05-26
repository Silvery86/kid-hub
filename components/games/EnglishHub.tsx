'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlphabetGame } from '@/components/games/AlphabetGame'
import { WordSafariGame } from '@/components/games/WordSafariGame'
import { SoundHuntGame } from '@/components/games/SoundHuntGame'
import { KidButton } from '@/components/ui/KidButton'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { GameBestScore, EnglishGameType, UserProgress } from '@/types'

type ActiveGame = EnglishGameType | null

interface EnglishHubProps {
  englishHomework: { periodId: string; homeworkNote: string } | null
}

// Per-card watermark rotation angles
const WATERMARK_ROT = [-8, 5, -6]

const GRADIENT_BIG = 'linear-gradient(160deg, #34d399 0%, #10b981 55%, #047857 100%)'
const GRADIENT_ROW = 'linear-gradient(110deg, #34d399 0%, #10b981 55%, #047857 100%)'
const SHADOW_BIG   = '0 18px 36px -16px rgba(16,185,129,.45)'
const SHADOW_ROW   = '0 14px 28px -14px rgba(16,185,129,.5)'

interface CardProps {
  id: EnglishGameType
  emoji: string
  title: string
  description: string
  bestStars: number
  idx: number
  onClick: (id: EnglishGameType) => void
}

function Stars({ count, size }: { count: number; size: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(size, 'leading-none', i <= count ? 'text-amber-400' : 'text-white/30')}
        >★</span>
      ))}
    </div>
  )
}

// ── Big card — landscape 3-col grid (compact=true for phone-L, false for tablet/desktop)
function EnglishGameCardBig({ id, emoji, title, description, bestStars, idx, onClick, compact = false }: CardProps & { compact?: boolean }) {
  const rot = WATERMARK_ROT[idx % 3]
  return (
    <button
      onClick={() => onClick(id)}
      data-testid={`game-card-${id}`}
      aria-label={`Chơi ${title}`}
      className={cn(
        'relative overflow-hidden flex flex-col text-white text-left w-full',
        'transition-transform duration-100 active:scale-[0.97] touch-manipulation select-none',
        compact
          ? 'rounded-2xl p-3 gap-1 aspect-[3/2]'
          : 'rounded-3xl p-5 gap-2 aspect-[4/3] min-h-tap-lg',
      )}
      style={{ background: GRADIENT_BIG, boxShadow: SHADOW_BIG }}
    >
      {/* Watermark emoji */}
      <div
        className={cn(
          'absolute -top-2 -right-2 opacity-[.18] pointer-events-none select-none leading-none',
          compact ? 'text-[90px]' : 'text-[170px]',
        )}
        style={{ transform: `rotate(${rot}deg)` }}
        aria-hidden="true"
      >
        {emoji}
      </div>

      {/* Game number pill + emoji icon */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span className={cn('rounded-full bg-white/20 font-extrabold', compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]')}>
          Trò chơi {idx + 1}
        </span>
        <span aria-hidden="true" className={cn('leading-none', compact ? 'text-2xl' : 'text-4xl')}>{emoji}</span>
      </div>

      {/* Title + description pinned to bottom */}
      <div className="relative z-10 mt-auto">
        <div className={cn('font-black leading-tight', compact ? 'text-sm' : 'text-xl')}>{title}</div>
        {!compact && <div className="text-xs font-bold text-white/85 mt-0.5">{description}</div>}
      </div>

      {/* Stars + CTA */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <Stars count={bestStars} size={compact ? 'text-sm' : 'text-xl'} />
        <span className={cn('rounded-full bg-white text-english-deep font-black whitespace-nowrap', compact ? 'text-[10px] px-2.5 py-1' : 'text-xs px-3.5 py-1.5')}>
          Chơi →
        </span>
      </div>
    </button>
  )
}

// ── Row card — portrait stack (scales up at sm: for tablet portrait)
function EnglishGameCardRow({ id, emoji, title, description, bestStars, onClick }: Omit<CardProps, 'idx'>) {
  return (
    <button
      onClick={() => onClick(id)}
      data-testid={`game-card-${id}`}
      aria-label={`Chơi ${title}`}
      className={cn(
        'relative overflow-hidden flex items-center gap-3.5 w-full text-white text-left',
        'rounded-2xl p-3.5 sm:p-4',
        'transition-transform duration-100 active:scale-[0.97] touch-manipulation select-none min-h-tap-lg',
      )}
      style={{ background: GRADIENT_ROW, boxShadow: SHADOW_ROW }}
    >
      {/* Watermark */}
      <div
        className="absolute -top-2.5 -right-2.5 text-[110px] opacity-[.18] pointer-events-none select-none leading-none rotate-[-8deg]"
        aria-hidden="true"
      >
        {emoji}
      </div>

      {/* Icon box */}
      <div
        className="bg-white/20 rounded-xl grid place-items-center shrink-0 relative z-10 size-14 text-3xl sm:size-16 sm:text-4xl"
        aria-hidden="true"
      >
        {emoji}
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-lg sm:text-2xl font-black leading-tight">{title}</div>
        <div className="text-xs sm:text-sm font-bold text-white/85 mt-1 truncate">{description}</div>
        <div className="mt-1.5">
          <Stars count={bestStars} size="text-lg sm:text-xl" />
        </div>
      </div>

      {/* CTA */}
      <span className="rounded-full bg-white text-english-deep font-black whitespace-nowrap shrink-0 relative z-10 text-xs px-3 py-1.5 sm:text-sm sm:px-3.5 sm:py-2">
        Chơi →
      </span>
    </button>
  )
}

const GAME_META: Record<EnglishGameType, { emoji: string; title: string; description: string }> = {
  alphabet:   { emoji: '🔤', title: 'Alphabet Explorer', description: 'Nhận biết chữ hoa và chữ thường' },
  vocabulary: { emoji: '🦁', title: 'Word Safari',       description: 'Ghép hình ảnh và từ vựng' },
  phonics:    { emoji: '🔊', title: 'Sound Hunt',        description: 'Tìm từ theo âm chữ cái' },
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

  const games = Object.keys(GAME_META) as EnglishGameType[]

  return (
    <div className="flex flex-col h-dvh bg-shell-kid overflow-hidden portrait:overflow-y-auto pl-16 lg:pl-56 portrait:pl-0 portrait:pb-16">
      <AppSidebar />

      {/* ── Landscape: compact header ─────────────────────────────── */}
      <div className="flex portrait:hidden shrink-0 items-center justify-between px-4 pt-2 pb-1">
        <div>
          <div className="text-base font-black text-text-primary">Tiếng Anh 🔤</div>
          <div className="text-xs font-bold text-text-secondary">Chọn một trò chơi</div>
        </div>
        {pendingHomework && (
          <span
            role="alert"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-amber-900"
          >
            🏠 Có bài tập
          </span>
        )}
      </div>

      {/* ── Landscape: 3-col compact card grid ───────────────────── */}
      <div className="grid portrait:hidden grid-cols-3 gap-2 flex-1 min-h-0 items-center px-4 pb-2">
        {games.map((game, i) => (
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
      </div>

      {/* ── Portrait: full header ─────────────────────────────────── */}
      <div className="hidden portrait:flex shrink-0 items-center justify-between px-4 pt-3">
        <KidButton variant="ghost" onClick={() => router.push('/dashboard')} className="text-text-secondary">
          ← Về trang chủ
        </KidButton>
        <h1 className="text-2xl font-extrabold text-text-primary">Tiếng Anh 🔤</h1>
        <div className="w-20" aria-hidden="true" />
      </div>

      {/* ── Portrait: homework banner ─────────────────────────────── */}
      {pendingHomework && (
        <div
          data-testid="homework-banner"
          role="alert"
          className="hidden portrait:flex items-center gap-3 mx-4 mt-2 rounded-2xl bg-amber-400 px-4 py-3.5"
          style={{ boxShadow: '0 6px 16px -8px rgba(251,191,36,.7)' }}
        >
          <span className="text-3xl" aria-hidden="true">🏠</span>
          <div>
            <p className="text-base font-extrabold text-amber-900">Hôm nay có bài tập Tiếng Anh!</p>
            {pendingHomework.homeworkNote && (
              <p className="text-sm font-semibold text-amber-800">{pendingHomework.homeworkNote}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Portrait: stacked row cards ───────────────────────────── */}
      <div className="hidden portrait:flex flex-col gap-3 px-4 py-3 pb-6">
        {games.map((game) => (
          <EnglishGameCardRow
            key={game}
            id={game}
            {...GAME_META[game]}
            bestStars={getBestStars(game)}
            onClick={setActiveGame}
          />
        ))}
      </div>

    </div>
  )
}
