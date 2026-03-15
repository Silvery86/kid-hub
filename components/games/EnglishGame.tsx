'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameSession } from '@/hooks/useGameSession';
import { useAudio } from '@/hooks/useAudio';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  generateLetterMatchQuestions,
  generatePictureWordQuestions,
} from '@/lib/data/englishLevels';
import { GameHud } from '@/components/games/GameHud';
import { GameResultScreen } from '@/components/games/GameResultScreen';
import { KidButton } from '@/components/ui/KidButton';
import { STORAGE_KEYS, INPUT_THROTTLE_MS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DifficultyLevel, GameBestScore, EnglishQuestion } from '@/types';

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Ghép chữ cái',
  2: 'Đọc hình ảnh',
  3: 'Đọc hình ảnh', // reuses level 2 for English
};

interface EnglishGameProps {
  initialLevel?: DifficultyLevel;
}

export const EnglishGame = ({ initialLevel = 1 }: EnglishGameProps) => {
  const router = useRouter();
  const { state, startGame, answerCorrect, answerWrong, starsEarned, pointsEarned } =
    useGameSession();
  const { initialise, play } = useAudio();
  const { addPoints } = useUserProgress();
  const [bestScores, setBestScores] = useLocalStorage<GameBestScore[]>(
    STORAGE_KEYS.USER_PROGRESS,
    [],
  );

  const [questions, setQuestions] = useState<EnglishQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const isProcessing = useRef(false);

  const currentQuestion = questions[state.currentQuestionIndex] ?? null;

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      initialise();
      const seed = Date.now() + level;
      const qs =
        level === 1
          ? generateLetterMatchQuestions(10, seed)
          : generatePictureWordQuestions(10, seed);
      setQuestions(qs);
      setSelectedAnswer(null);
      setFeedbackState('idle');
      startGame('english', level);
    },
    [initialise, startGame],
  );

  useEffect(() => {
    handleStart(initialLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status === 'result') {
      addPoints(pointsEarned);
      play('complete');
      const newBest: GameBestScore = {
        gameType: 'english',
        level: state.level,
        score: state.correctCount * 10,
        starsEarned,
        achievedAt: new Date().toISOString(),
      };
      setBestScores((prev) => {
        const filtered = prev.filter(
          (b) => !(b.gameType === 'english' && b.level === state.level),
        );
        return [...filtered, newBest];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (isProcessing.current || state.status !== 'playing' || !currentQuestion) return;
      isProcessing.current = true;

      const isCorrect = answer === currentQuestion.correctAnswer;
      setSelectedAnswer(answer);
      setFeedbackState(isCorrect ? 'correct' : 'wrong');
      play(isCorrect ? 'correct' : 'wrong');

      setTimeout(() => {
        setSelectedAnswer(null);
        setFeedbackState('idle');
        if (isCorrect) answerCorrect();
        else answerWrong();
        isProcessing.current = false;
      }, INPUT_THROTTLE_MS);
    },
    [state.status, currentQuestion, play, answerCorrect, answerWrong],
  );

  const bestScore =
    bestScores.find((b) => b.gameType === 'english' && b.level === state.level) ?? null;

  // ── Result ─────────────────────────────────────────────────
  if (state.status === 'result') {
    return (
      <GameResultScreen
        gameType="english"
        correctCount={state.correctCount}
        starsEarned={starsEarned}
        pointsEarned={pointsEarned}
        bestStars={bestScore?.starsEarned ?? null}
        onReplay={() => handleStart(state.level)}
        onExit={() => router.push('/dashboard')}
      />
    );
  }

  // ── Level select ───────────────────────────────────────────
  if (state.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8">
        <div className="text-8xl" aria-hidden="true">🔤</div>
        <h1 className="text-5xl font-extrabold text-white">Word Explorer</h1>
        <div className="flex gap-4">
          {([1, 2] as DifficultyLevel[]).map((lvl) => (
            <KidButton key={lvl} variant="secondary" onClick={() => handleStart(lvl)} className="min-w-48">
              {LEVEL_LABELS[lvl]}
            </KidButton>
          ))}
        </div>
        <KidButton variant="ghost" onClick={() => router.push('/dashboard')} className="text-slate-400">
          Quay lại
        </KidButton>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────
  if (!currentQuestion) return null;

  const isLetterMatch = currentQuestion.type === 'letter-match';

  return (
    <div className="flex flex-col min-h-screen">
      <GameHud
        correctCount={state.correctCount}
        questionIndex={state.currentQuestionIndex}
        secondsLeft={state.secondsLeft}
        onExit={() => router.push('/dashboard')}
      />

      <div
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-10 px-8 transition-colors duration-300',
          feedbackState === 'correct' && 'bg-emerald-900/40',
          feedbackState === 'wrong' && 'bg-red-900/40',
        )}
      >
        {/* Emoji / image */}
        {currentQuestion.imageUrl && (
          <div className="text-[8rem] select-none leading-none" aria-hidden="true">
            {currentQuestion.imageUrl}
          </div>
        )}

        {/* Prompt */}
        <div className="rounded-3xl bg-slate-700 px-10 py-6 shadow-2xl animate-in fade-in anim-duration-200">
          <p className="text-6xl font-extrabold text-white text-center tracking-widest select-none">
            {currentQuestion.prompt}
          </p>
          {isLetterMatch && (
            <p className="text-center text-slate-400 text-lg mt-2 font-semibold">
              Chọn chữ cái còn thiếu
            </p>
          )}
        </div>

        {/* Answer buttons */}
        <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            return (
              <KidButton
                key={option}
                variant="secondary"
                onClick={() => handleAnswer(option)}
                isDisabled={isProcessing.current}
                className={cn(
                  'text-4xl font-extrabold min-w-36 min-h-24 transition-colors duration-200',
                  isSelected && isCorrectOption && 'bg-emerald-500 border-emerald-700',
                  isSelected && !isCorrectOption && 'bg-red-500 border-red-700',
                )}
              >
                {option}
              </KidButton>
            );
          })}
        </div>
      </div>
    </div>
  );
};
