// Games domain — cross-platform contract types (Web + Mobile).
// Owner: @kid-hub/shared. Question shapes, session summary, best scores and
// the save-progress inputs consumed by /api/v1. The React session-state type
// (GameSessionState) stays in apps/web until the reducer is extracted (Phase 3).

export type GameType = 'math' | 'english'
export type MathGameType = 'counting' | 'addition' | 'shapes'
export type EnglishGameType = 'alphabet' | 'vocabulary' | 'phonics'
export type GameStatus = 'idle' | 'playing' | 'paused' | 'result'
export type DifficultyLevel = 1 | 2 | 3

export interface MathQuestion {
  id: string
  operandA: number
  operandB: number
  operator: '+' | '-'
  correctAnswer: number
  options: [number, number] // Always exactly two choices
}

export interface CountingQuestion {
  id: string
  objectEmoji: string
  count: number
  choices: number[]       // [correct, distractor1, distractor2] shuffled
  correctIndex: number
}

export type ShapeId = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart'

export interface ShapeQuestion {
  id: string
  mode: 'name-to-shape' | 'shape-to-name'
  targetShape: ShapeId
  choices: ShapeId[]      // [correct, distractor1, distractor2] shuffled
  correctIndex: number
}

export interface EnglishQuestion {
  id: string
  type: 'letter-match' | 'picture-word' | 'sentence-arrange'
  prompt: string
  imageUrl?: string
  correctAnswer: string
  options: string[]
}

export interface AlphabetQuestion {
  id: string
  type: 'upper-to-lower' | 'lower-to-upper'
  prompt: string        // The displayed letter (uppercase or lowercase)
  choices: string[]     // 4 letters (correct + 3 distractors), shuffled
  correctAnswer: string
}

export interface WordSafariQuestion {
  id: string
  type: 'image-to-word' | 'word-to-image'
  prompt: string         // Emoji (Mode A) or word text (Mode B)
  choices: string[]      // 3–4 items (words for Mode A, emojis for Mode B), shuffled
  correctAnswer: string
  theme: 'animals' | 'fruits' | 'other'
}

export interface SoundHuntQuestion {
  id: string
  type: 'sound-hunt'
  targetLetter: string   // e.g. 'C'
  phonemeHint: string    // e.g. '/k/ — "c" trong từ "cat"'
  choices: string[]      // 3–4 emoji strings, shuffled
  correctAnswer: string  // The emoji whose word starts with targetLetter
  correctWord: string    // The word (e.g. 'cat') — for test assertion
}

export interface GameSession {
  gameType: GameType
  level: DifficultyLevel
  status: GameStatus
  currentQuestionIndex: number
  score: number
  correctCount: number
  totalQuestions: number
  startedAt: number // Unix timestamp ms
}

export interface GameBestScore {
  gameType: GameType
  level: DifficultyLevel
  score: number
  starsEarned: 1 | 2 | 3
  achievedAt: string // ISO date string
  subType?: string   // "counting" | "addition" | "shapes" for math; "alphabet" | "vocabulary" | "phonics" for english
}

interface SaveProgressInputBase {
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}

export interface SaveMathProgressInput extends SaveProgressInputBase {
  minigame: MathGameType
}

export interface SaveEnglishProgressInput extends SaveProgressInputBase {
  minigame: EnglishGameType
}
