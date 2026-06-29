/** GameHud — in-game heads-up display showing progress, timer, and exit button. */

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
    <div className="flex items-center gap-2 bg-slate-800/90 px-2 py-2 backdrop-blur-sm portrait:gap-4 portrait:px-6 portrait:py-3">
      {/* Exit */}
      <button
        onClick={onExit}
        aria-label="Thoát trò chơi"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-lg font-bold text-slate-300 transition-colors hover:bg-slate-600 portrait:h-14 portrait:w-14 portrait:rounded-xl portrait:text-xl min-h-tap min-w-tap"
      >
        ✕
      </button>

      {/* Question progress bar */}
      <div className="flex-1">
        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-400 portrait:text-sm">
          <span>
            Câu {questionIndex + 1}/{GAME_QUESTIONS_PER_SESSION}
          </span>
          <span className="text-emerald-400">{correctCount}✓</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-700 portrait:h-2">
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
        <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true" className="portrait:h-12 portrait:w-12">
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
