'use client'

/**
 * EnglishHub — the /english route hub that displays 3 mini-game cards and
 * manages in-place game rendering with homework banner support.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlphabetGame } from '@/components/games/AlphabetGame'
import { WordSafariGame } from '@/components/games/WordSafariGame'
import { SoundHuntGame } from '@/components/games/SoundHuntGame'
import { KidButton } from '@/components/ui/KidButton'
import { StarRating } from '@/components/ui/StarRating'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { GameBestScore, EnglishGameType, UserProgress } from '@/types'

type ActiveGame = EnglishGameType | null

interface EnglishHubProps {
  englishHomework: { periodId: string; homeworkNote: string } | null
}

interface GameCardProps {
  id: EnglishGameType
  emoji: string
  title: string
  description: string
  bestScore?: GameBestScore | null
  onClick: (game: EnglishGameType) => void
}

/** A tap-friendly card that launches a mini-game. */
const GameCard = ({ id, emoji, title, description, bestScore, onClick }: GameCardProps) => (
  <button
    onClick={() => onClick(id)}
    data-testid={`game-card-${id}`}
    aria-label={`Chơi ${title}`}
    className={cn(
      'flex flex-col gap-1.5 portrait:gap-3 rounded-3xl bg-english p-3 portrait:p-6 shadow-lg text-left',
      'transition-transform duration-100 active:scale-[0.97] touch-manipulation select-none',
      'w-full min-h-tap-lg'
    )}
  >
    <div className="text-3xl portrait:text-6xl" aria-hidden="true">{emoji}</div>
    <div>
      <h3 className="text-base portrait:text-2xl font-extrabold text-white">{title}</h3>
      <p className="text-xs portrait:text-sm text-white/80">{description}</p>
    </div>
    {bestScore ? (
      <div className="flex items-center gap-2">
        <StarRating value={bestScore.starsEarned} className="[&_span]:text-2xl" />
        <span className="text-xs font-semibold text-white/70">Kỷ lục</span>
      </div>
    ) : (
      <p className="text-xs font-semibold text-white/60">Chưa chơi</p>
    )}
  </button>
)

/** Homework reminder banner shown when an English homework period is pending. */
const HomeworkBanner = ({ note }: { note: string }) => (
  <div
    className="flex items-center gap-3 rounded-2xl bg-yellow-400 px-6 py-4 shadow-md"
    data-testid="homework-banner"
    role="alert"
  >
    <span className="text-4xl" aria-hidden="true">🏠</span>
    <div>
      <p className="text-xl font-extrabold text-yellow-900">Hôm nay có bài tập Tiếng Anh!</p>
      {note && <p className="text-sm font-semibold text-yellow-800">{note}</p>}
    </div>
  </div>
)

const GAME_META: Record<EnglishGameType, { emoji: string; title: string; description: string }> = {
  alphabet: { emoji: '🔤', title: 'Alphabet Explorer', description: 'Nhận biết chữ hoa và chữ thường' },
  vocabulary: { emoji: '🦁', title: 'Word Safari', description: 'Ghép hình ảnh và từ vựng' },
  phonics: { emoji: '🔊', title: 'Sound Hunt', description: 'Tìm từ theo âm chữ cái' },
}

/**
 * Renders the /english hub with 3 game cards. When a card is tapped, the selected
 * game mounts in-place. On game exit, the hub is restored.
 */
export const EnglishHub = ({ englishHomework }: EnglishHubProps) => {
  const router = useRouter()
  const [activeGame, setActiveGame] = useState<ActiveGame>(null)
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)
  const [progress] = useLocalStorage<UserProgress | null>(STORAGE_KEYS.USER_PROGRESS, null)
  const bestScores: GameBestScore[] = Array.isArray(progress?.bestScores) ? progress.bestScores : []

  const pendingHomework = homeworkSubmitted ? null : englishHomework

  const getBestScore = (minigame: EnglishGameType): GameBestScore | null =>
    bestScores.find((b) => b.gameType === 'english' && b.subType === minigame) ?? null

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
    <div className="flex h-dvh overflow-y-auto flex-col items-center gap-3 portrait:gap-8 px-6 py-3 portrait:py-10 bg-shell-kid">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <KidButton variant="ghost" onClick={() => router.push('/dashboard')} className="text-text-secondary landscape:min-h-tap landscape:py-1">
          ← Về trang chủ
        </KidButton>
        <h1 className="text-2xl portrait:text-4xl font-extrabold text-text-primary">Tiếng Anh 🔤</h1>
        <div className="w-16 portrait:w-24" aria-hidden="true" />
      </div>

      {pendingHomework && <HomeworkBanner note={pendingHomework.homeworkNote} />}

      <div className="grid w-full max-w-2xl grid-cols-3 portrait:grid-cols-1 gap-3 portrait:gap-5">
        {(Object.keys(GAME_META) as EnglishGameType[]).map((game) => (
          <GameCard
            key={game}
            id={game}
            {...GAME_META[game]}
            bestScore={getBestScore(game)}
            onClick={setActiveGame}
          />
        ))}
      </div>
    </div>
  )
}
