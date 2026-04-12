import { cn } from '@/lib/utils'
import { GAME_SECONDS_PER_QUESTION, GAME_QUESTIONS_PER_SESSION } from '@/lib/constants'

interface GameHudProps {
  correctCount: number
  questionIndex: number
  secondsLeft: number
  onExit: () => void
}

/**
 * Top HUD bar shown during an active game session.
 * Shows: exit button | question counter | timer ring | score
 */
export const GameHud = ({ correctCount, questionIndex, secondsLeft, onExit }: GameHudProps) => {
  const progress = questionIndex / GAME_QUESTIONS_PER_SESSION
  const timeProgress = secondsLeft / GAME_SECONDS_PER_QUESTION
  const isUrgent = secondsLeft <= 3

  // SVG ring constants
  const radius = 18
  const circ = 2 * Math.PI * radius
  const dash = circ * timeProgress

  return (
    <div className="flex items-center gap-4 bg-slate-800/90 px-6 py-3 backdrop-blur-sm">
      {/* Exit */}
      <button
        onClick={onExit}
        aria-label="Thoát trò chơi"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-xl font-bold text-slate-300 transition-colors hover:bg-slate-600"
      >
        ✕
      </button>

      {/* Question progress bar */}
      <div className="flex-1">
        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-400">
          <span>
            Câu hỏi {questionIndex + 1} / {GAME_QUESTIONS_PER_SESSION}
          </span>
          <span className="text-emerald-400">{correctCount} đúng</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-blue-400 transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Timer ring */}
      <div
        className={cn('shrink-0', isUrgent && 'animate-pulse')}
        aria-label={`${secondsLeft} giây còn lại`}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
          {/* Track */}
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#334155" strokeWidth="4" />
          {/* Progress */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={isUrgent ? '#f87171' : '#60a5fa'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 24 24)"
            className="transition-[stroke-dasharray] duration-1000 ease-linear"
          />
          <text
            x="24"
            y="29"
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={isUrgent ? '#f87171' : '#e2e8f0'}
          >
            {secondsLeft}
          </text>
        </svg>
      </div>
    </div>
  )
}
