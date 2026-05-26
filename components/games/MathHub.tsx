'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CountingGame } from '@/components/games/CountingGame'
import { MathGame } from '@/components/games/MathGame'
import { ShapeGame } from '@/components/games/ShapeGame'
import { KidButton } from '@/components/ui/KidButton'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { GameBestScore, MathGameType, UserProgress } from '@/types'

type ActiveGame = MathGameType | null

interface MathHubProps {
  mathHomework: { periodId: string; homeworkNote: string } | null
}

// Per-card watermark rotation angles
const WATERMARK_ROT = [-8, 5, -6]

const GRADIENT_BIG = 'linear-gradient(160deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)'
const SHADOW_BIG   = '0 18px 36px -16px rgba(37,99,235,.45)'
const SHADOW_ROW   = '0 16px 32px -16px rgba(59,130,246,.5)'

interface CardProps {
  id: MathGameType
  emoji: string
  title: string
  description: string
  bestStars: number
  idx: number
  onClick: (id: MathGameType) => void
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

// ── Big gradient card — landscape 3-col grid (compact=true for phone-L)
function MathGameCardBig({ id, emoji, title, description, bestStars, idx, onClick, compact = false }: CardProps & { compact?: boolean }) {
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

      {/* Game number pill + icon */}
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
        <span className={cn('rounded-full bg-white text-math-deep font-black whitespace-nowrap', compact ? 'text-[10px] px-2.5 py-1' : 'text-xs px-3.5 py-1.5')}>
          Chơi →
        </span>
      </div>
    </button>
  )
}

// ── Flat card — portrait stack (solid bg-math, circle decoration, no CTA)
function MathGameCardFlat({ id, emoji, title, description, bestStars, onClick }: Omit<CardProps, 'idx'>) {
  return (
    <button
      onClick={() => onClick(id)}
      data-testid={`game-card-${id}`}
      aria-label={`Chơi ${title}`}
      className={cn(
        'relative overflow-hidden flex items-center gap-2.5 w-full text-white text-left',
        'rounded-3xl bg-math p-3.5 sm:p-4',
        'transition-transform duration-100 active:scale-[0.97] touch-manipulation select-none min-h-tap-lg',
      )}
      style={{ boxShadow: SHADOW_ROW }}
    >
      {/* Circle background decoration */}
      <div className="absolute -right-4 -top-4 size-[90px] rounded-full bg-white/[.12] pointer-events-none" />

      {/* Bare emoji */}
      <div className="text-5xl sm:text-6xl leading-none shrink-0 relative z-10" aria-hidden="true">
        {emoji}
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-xl sm:text-2xl font-black leading-tight">{title}</div>
        <div className="text-xs sm:text-sm font-bold text-white/85 mt-1">{description}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <Stars count={bestStars} size="text-xl sm:text-2xl" />
          <span className="text-xs font-bold text-white/70">Kỷ lục</span>
        </div>
      </div>
    </button>
  )
}

const GAME_META: Record<MathGameType, { emoji: string; title: string; description: string }> = {
  counting: { emoji: '🌟', title: 'Đếm Sao',       description: 'Đếm số đồ vật (1–10)' },
  addition: { emoji: '🔢', title: 'Number Ninja',   description: 'Cộng trừ trong 10' },
  shapes:   { emoji: '🔷', title: 'Khám Phá Hình', description: 'Nhận biết hình học' },
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

  const games = Object.keys(GAME_META) as MathGameType[]

  return (
    <div className="flex flex-col h-dvh bg-shell-kid overflow-hidden portrait:overflow-y-auto pl-16 lg:pl-56 portrait:pl-0 portrait:pb-16">
      <AppSidebar />

      {/* ── Landscape: compact header ─────────────────────────────── */}
      <div className="flex portrait:hidden shrink-0 items-center justify-between px-4 pt-2 pb-1">
        <div>
          <div className="text-base font-black text-text-primary">Toán Học 🧮</div>
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
      </div>

      {/* ── Portrait: full header ─────────────────────────────────── */}
      <div className="hidden portrait:flex shrink-0 items-center justify-between px-4 pt-3">
        <KidButton variant="ghost" onClick={() => router.push('/dashboard')} className="text-text-secondary">
          ← Về trang chủ
        </KidButton>
        <h1 className="text-2xl font-extrabold text-text-primary">Toán Học 🧮</h1>
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
            <p className="text-base font-extrabold text-amber-900">Hôm nay có bài tập Toán!</p>
            {pendingHomework.homeworkNote && (
              <p className="text-sm font-semibold text-amber-800">{pendingHomework.homeworkNote}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Portrait: stacked flat cards ─────────────────────────── */}
      <div className="hidden portrait:flex flex-col gap-3 px-4 py-3 pb-6">
        {games.map((game) => (
          <MathGameCardFlat
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
