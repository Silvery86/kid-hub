import { cn } from '@/lib/utils';
import { GAME_SECONDS_PER_QUESTION, GAME_QUESTIONS_PER_SESSION } from '@/lib/constants';

interface GameHudProps {
  correctCount: number;
  questionIndex: number;
  secondsLeft: number;
  onExit: () => void;
}

/**
 * Top HUD bar shown during an active game session.
 * Shows: exit button | question counter | timer ring | score
 */
export const GameHud = ({ correctCount, questionIndex, secondsLeft, onExit }: GameHudProps) => {
  const progress = questionIndex / GAME_QUESTIONS_PER_SESSION;
  const timeProgress = secondsLeft / GAME_SECONDS_PER_QUESTION;
  const isUrgent = secondsLeft <= 3;

  // SVG ring constants
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const dash = circ * timeProgress;

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-slate-800/90 backdrop-blur-sm">
      {/* Exit */}
      <button
        onClick={onExit}
        aria-label="Thoát trò chơi"
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors text-xl font-bold shrink-0"
      >
        ✕
      </button>

      {/* Question progress bar */}
      <div className="flex-1">
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
          <span>Câu hỏi {questionIndex + 1} / {GAME_QUESTIONS_PER_SESSION}</span>
          <span className="text-emerald-400">{correctCount} đúng</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Timer ring */}
      <div className={cn('shrink-0', isUrgent && 'animate-pulse')} aria-label={`${secondsLeft} giây còn lại`}>
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
            className="transition-all duration-1000 ease-linear"
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
  );
};
