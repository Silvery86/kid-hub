/** GameResultScreen — post-game summary card with stars, score, and navigation actions. */

import { StarRating } from '@/components/ui/StarRating'
import { KidButton } from '@/components/ui/KidButton'
import { GAME_QUESTIONS_PER_SESSION } from '@/lib/constants'
import type { GameType } from '@/types'

interface GameResultScreenProps {
  gameType: GameType
  correctCount: number
  starsEarned: 1 | 2 | 3
  pointsEarned: number
  bestStars: 1 | 2 | 3 | null
  onReplay: () => void
  onExit: () => void
  onHomeworkSubmit?: () => void
  homeworkSubmitted?: boolean
}

const EMOJI_BY_STARS: Record<1 | 2 | 3, string> = {
  1: '😊',
  2: '🎉',
  3: '🏆',
}

const MESSAGE_BY_STARS: Record<1 | 2 | 3, string> = {
  1: 'Cố lên! Lần sau sẽ tốt hơn.',
  2: 'Làm tốt lắm! Tiếp tục nhé!',
  3: 'Xuất sắc! Khôi thật giỏi!',
}

export const GameResultScreen = ({
  correctCount,
  starsEarned,
  pointsEarned,
  bestStars,
  onReplay,
  onExit,
  onHomeworkSubmit,
  homeworkSubmitted,
}: GameResultScreenProps) => {
  const isNewBest = bestStars === null || starsEarned > bestStars

  return (
    <div className="animate-in fade-in zoom-in-95 anim-duration-300 flex min-h-screen flex-col items-center justify-center gap-8 px-8">
      {/* Trophy / emoji */}
      <div className="text-9xl select-none" aria-hidden="true">
        {EMOJI_BY_STARS[starsEarned]}
      </div>

      {/* Stars */}
      <StarRating value={starsEarned} className="scale-150" />

      {/* Message */}
      <p className="text-center text-3xl font-extrabold text-white">
        {MESSAGE_BY_STARS[starsEarned]}
      </p>

      {/* Score breakdown */}
      <div className="flex gap-6">
        <div className="rounded-2xl bg-slate-700 px-6 py-4 text-center">
          <p className="text-sm font-bold tracking-wider text-slate-400 uppercase">Đúng</p>
          <p className="text-4xl font-extrabold text-white">
            {correctCount}
            <span className="text-2xl text-slate-400"> / {GAME_QUESTIONS_PER_SESSION}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-slate-700 px-6 py-4 text-center">
          <p className="text-sm font-bold tracking-wider text-slate-400 uppercase">Điểm</p>
          <p className="text-4xl font-extrabold text-yellow-400">+{pointsEarned}</p>
        </div>
        {isNewBest && (
          <div className="rounded-2xl bg-yellow-500 px-6 py-4 text-center">
            <p className="text-sm font-bold tracking-wider text-yellow-900 uppercase">Kỷ lục</p>
            <p className="text-4xl font-extrabold text-yellow-900">Mới! 🌟</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <KidButton variant="ghost" onClick={onExit} className="border-slate-600 text-slate-300">
          Về trang chủ
        </KidButton>
        <KidButton variant="primary" onClick={onReplay}>
          Chơi lại 🔄
        </KidButton>
        {onHomeworkSubmit && !homeworkSubmitted && (
          <KidButton variant="secondary" onClick={onHomeworkSubmit}>
            🏠 Nộp bài tập
          </KidButton>
        )}
        {homeworkSubmitted && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3">
            <span className="text-xl font-bold text-white">✅ Đã nộp bài!</span>
          </div>
        )}
      </div>
    </div>
  )
}
