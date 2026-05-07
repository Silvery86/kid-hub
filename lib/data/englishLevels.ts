/** English word bank and question generators for the Word Explorer mini-game. */

import type { EnglishQuestion, AlphabetQuestion, WordSafariQuestion, SoundHuntQuestion } from '@/types'

/**
 * English word bank — 50 curated words pitched at Vietnamese 1st-grade learners.
 * Level 1: letter-matching (fill the missing letter)
 * Level 2: picture-word matching (choose the word shown by the image emoji)
 *
 * imageUrl uses a representative emoji as a stand-in until real image assets exist.
 */

interface WordEntry {
  word: string
  imageEmoji: string
  missingIndex: number // Index of the letter to blank out for Level 1
}

const WORD_BANK: readonly WordEntry[] = [
  { word: 'cat', imageEmoji: '🐱', missingIndex: 0 },
  { word: 'dog', imageEmoji: '🐶', missingIndex: 0 },
  { word: 'fish', imageEmoji: '🐟', missingIndex: 0 },
  { word: 'bird', imageEmoji: '🐦', missingIndex: 0 },
  { word: 'frog', imageEmoji: '🐸', missingIndex: 0 },
  { word: 'duck', imageEmoji: '🦆', missingIndex: 0 },
  { word: 'bear', imageEmoji: '🐻', missingIndex: 0 },
  { word: 'lion', imageEmoji: '🦁', missingIndex: 0 },
  { word: 'cow', imageEmoji: '🐄', missingIndex: 0 },
  { word: 'pig', imageEmoji: '🐷', missingIndex: 0 },
  { word: 'egg', imageEmoji: '🥚', missingIndex: 0 },
  { word: 'apple', imageEmoji: '🍎', missingIndex: 0 },
  { word: 'banana', imageEmoji: '🍌', missingIndex: 0 },
  { word: 'mango', imageEmoji: '🥭', missingIndex: 0 },
  { word: 'melon', imageEmoji: '🍈', missingIndex: 0 },
  { word: 'lemon', imageEmoji: '🍋', missingIndex: 0 },
  { word: 'grape', imageEmoji: '🍇', missingIndex: 0 },
  { word: 'peach', imageEmoji: '🍑', missingIndex: 0 },
  { word: 'plum', imageEmoji: '🫐', missingIndex: 0 },
  { word: 'kiwi', imageEmoji: '🥝', missingIndex: 0 },
  { word: 'car', imageEmoji: '🚗', missingIndex: 0 },
  { word: 'bus', imageEmoji: '🚌', missingIndex: 0 },
  { word: 'boat', imageEmoji: '⛵', missingIndex: 0 },
  { word: 'bike', imageEmoji: '🚲', missingIndex: 0 },
  { word: 'train', imageEmoji: '🚆', missingIndex: 0 },
  { word: 'plane', imageEmoji: '✈️', missingIndex: 0 },
  { word: 'ball', imageEmoji: '⚽', missingIndex: 0 },
  { word: 'kite', imageEmoji: '🪁', missingIndex: 0 },
  { word: 'drum', imageEmoji: '🥁', missingIndex: 0 },
  { word: 'doll', imageEmoji: '🪆', missingIndex: 0 },
  { word: 'cake', imageEmoji: '🎂', missingIndex: 0 },
  { word: 'milk', imageEmoji: '🥛', missingIndex: 0 },
  { word: 'rice', imageEmoji: '🍚', missingIndex: 0 },
  { word: 'soup', imageEmoji: '🍲', missingIndex: 0 },
  { word: 'bread', imageEmoji: '🍞', missingIndex: 0 },
  { word: 'moon', imageEmoji: '🌙', missingIndex: 0 },
  { word: 'star', imageEmoji: '⭐', missingIndex: 0 },
  { word: 'rain', imageEmoji: '🌧️', missingIndex: 0 },
  { word: 'snow', imageEmoji: '❄️', missingIndex: 0 },
  { word: 'sun', imageEmoji: '☀️', missingIndex: 0 },
  { word: 'tree', imageEmoji: '🌳', missingIndex: 0 },
  { word: 'leaf', imageEmoji: '🍃', missingIndex: 0 },
  { word: 'rose', imageEmoji: '🌹', missingIndex: 0 },
  { word: 'seed', imageEmoji: '🌱', missingIndex: 0 },
  { word: 'rock', imageEmoji: '🪨', missingIndex: 0 },
  { word: 'hat', imageEmoji: '🎩', missingIndex: 0 },
  { word: 'book', imageEmoji: '📖', missingIndex: 0 },
  { word: 'bell', imageEmoji: '🔔', missingIndex: 0 },
  { word: 'flag', imageEmoji: '🚩', missingIndex: 0 },
  { word: 'tent', imageEmoji: '⛺', missingIndex: 0 },
]

/** Pick `count` distinct items from an array using a seeded rng. */
const pickRandom = <T>(arr: readonly T[], count: number, rng: () => number): T[] => {
  const copy = [...arr].sort(() => rng() - 0.5)
  return copy.slice(0, count)
}

const createRng = (seed: number) => {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Level 1 — Letter matching
 * Shows "_ a t" and asks the child to pick the missing first letter.
 * Distractors are nearby alphabet letters.
 */
export const generateLetterMatchQuestions = (
  count: number,
  seed: number = Date.now()
): EnglishQuestion[] => {
  const rng = createRng(seed)
  const selected = pickRandom(WORD_BANK, count, rng)

  return selected.map((entry, i) => {
    const correct = entry.word[0] ?? 'a'
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    const idx = alphabet.indexOf(correct)
    const distractors = [
      alphabet[(idx + 1) % 26] ?? 'b',
      alphabet[(idx + 2) % 26] ?? 'c',
      alphabet[Math.abs(idx - 1)] ?? 'd',
    ].filter((l) => l !== correct)

    // Pick 3 unique distractors and shuffle with the correct answer
    const options = [correct, ...distractors.slice(0, 3)].sort(() => rng() - 0.5)
    const prompt = `_ ${entry.word.slice(1).split('').join(' ')}`

    return {
      id: `letter-${i}-${seed}`,
      type: 'letter-match' as const,
      prompt,
      imageUrl: entry.imageEmoji,
      correctAnswer: correct,
      options,
    }
  })
}

/**
 * Level 2 — Picture-word matching
 * Shows an emoji image and asks the child to pick the correct word from 4 options.
 */
export const generatePictureWordQuestions = (
  count: number,
  seed: number = Date.now()
): EnglishQuestion[] => {
  const rng = createRng(seed)
  const selected = pickRandom(WORD_BANK, count, rng)

  return selected.map((entry, i) => {
    const distractors = WORD_BANK.filter((w) => w.word !== entry.word)
      .sort(() => rng() - 0.5)
      .slice(0, 3)
      .map((w) => w.word)

    const options = [entry.word, ...distractors].sort(() => rng() - 0.5)

    return {
      id: `picword-${i}-${seed}`,
      type: 'picture-word' as const,
      prompt: entry.imageEmoji,
      imageUrl: entry.imageEmoji,
      correctAnswer: entry.word,
      options,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// New generators — English Hub mini-games
// ─────────────────────────────────────────────────────────────────────────────

// ── Alphabet Explorer ─────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Letters A–M (Level 1), N–Z (Level 2), A–Z (Level 3). */
const ALPHABET_LEVELS: Record<1 | 2 | 3, readonly string[]> = {
  1: Array.from('ABCDEFGHIJKLM'),
  2: Array.from('NOPQRSTUVWXYZ'),
  3: Array.from(ALPHABET),
}

/**
 * Returns visually-similar uppercase distractors for a given uppercase letter.
 * Falls back to adjacent alphabet letters when no specific confusable is defined.
 */
const getUpperDistractors = (letter: string): string[] => {
  const confusables: Record<string, string[]> = {
    B: ['D', 'P', 'R'], C: ['G', 'O', 'Q'], D: ['B', 'O', 'P'],
    E: ['F', 'B', 'L'], F: ['E', 'P', 'T'], G: ['C', 'O', 'Q'],
    H: ['N', 'M', 'K'], I: ['L', 'T', 'J'], J: ['I', 'L', 'T'],
    K: ['X', 'H', 'R'], L: ['I', 'E', 'F'], M: ['N', 'H', 'W'],
    N: ['M', 'H', 'W'], O: ['Q', 'C', 'G'], P: ['R', 'B', 'F'],
    Q: ['O', 'G', 'C'], R: ['P', 'B', 'K'], S: ['Z', 'C', 'G'],
    T: ['I', 'F', 'Y'], U: ['V', 'W', 'J'], V: ['U', 'W', 'Y'],
    W: ['M', 'V', 'N'], X: ['K', 'Y', 'Z'], Y: ['V', 'T', 'X'],
    Z: ['S', 'N', 'X'], A: ['H', 'M', 'N'],
  }
  return confusables[letter] ?? [
    ALPHABET[(ALPHABET.indexOf(letter) + 1) % 26]!,
    ALPHABET[(ALPHABET.indexOf(letter) + 2) % 26]!,
    ALPHABET[Math.abs(ALPHABET.indexOf(letter) - 1)]!,
  ]
}

/**
 * Game 1: Alphabet Explorer — generates upper↔lower letter recognition questions.
 * Level 1: A–M, Mode A (upper→lower) only.
 * Level 2: N–Z, Mode A only.
 * Level 3: A–Z, dual mode (upper→lower and lower→upper mixed).
 */
export const generateAlphabetQuestions = (
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): AlphabetQuestion[] => {
  const rng = createRng(seed)
  const pool = ALPHABET_LEVELS[level]
  const selected = pickRandom(pool, Math.min(count, pool.length), rng)
    .slice(0, count)

  // If pool is smaller than count, repeat with different picks
  const letters = selected.length >= count
    ? selected
    : [...selected, ...pickRandom(pool, count - selected.length, rng)]

  return letters.map((upper, i) => {
    const lower = upper.toLowerCase()
    const dualMode = level === 3
    const isLowerToUpper = dualMode && rng() > 0.5

    const prompt = isLowerToUpper ? lower : upper
    const correct = isLowerToUpper ? upper : lower
    const type = isLowerToUpper ? ('lower-to-upper' as const) : ('upper-to-lower' as const)

    const distractors = getUpperDistractors(upper)
      .slice(0, 3)
      .map((d) => (isLowerToUpper ? d : d.toLowerCase()))
      .filter((d) => d !== correct)

    const choices = [correct, ...distractors].sort(() => rng() - 0.5)

    return {
      id: `alpha-${i}-${seed}`,
      type,
      prompt,
      choices,
      correctAnswer: correct,
    }
  })
}

// ── Word Safari ───────────────────────────────────────────────────────────────

interface ThemeEntry {
  word: string
  emoji: string
  theme: 'animals' | 'fruits' | 'other'
}

const SAFARI_BANK: readonly ThemeEntry[] = [
  // Theme 1 — Animals
  { word: 'cat',    emoji: '🐱', theme: 'animals' },
  { word: 'dog',    emoji: '🐶', theme: 'animals' },
  { word: 'fish',   emoji: '🐟', theme: 'animals' },
  { word: 'bird',   emoji: '🐦', theme: 'animals' },
  { word: 'frog',   emoji: '🐸', theme: 'animals' },
  { word: 'duck',   emoji: '🦆', theme: 'animals' },
  { word: 'bear',   emoji: '🐻', theme: 'animals' },
  { word: 'lion',   emoji: '🦁', theme: 'animals' },
  { word: 'cow',    emoji: '🐄', theme: 'animals' },
  { word: 'pig',    emoji: '🐷', theme: 'animals' },
  // Theme 2 — Fruits
  { word: 'apple',  emoji: '🍎', theme: 'fruits' },
  { word: 'banana', emoji: '🍌', theme: 'fruits' },
  { word: 'mango',  emoji: '🥭', theme: 'fruits' },
  { word: 'melon',  emoji: '🍈', theme: 'fruits' },
  { word: 'lemon',  emoji: '🍋', theme: 'fruits' },
  { word: 'grape',  emoji: '🍇', theme: 'fruits' },
  { word: 'peach',  emoji: '🍑', theme: 'fruits' },
  { word: 'plum',   emoji: '🫐', theme: 'fruits' },
  { word: 'kiwi',   emoji: '🥝', theme: 'fruits' },
  { word: 'egg',    emoji: '🥚', theme: 'fruits' },
  // Theme 3 — Vehicles & Others
  { word: 'car',    emoji: '🚗', theme: 'other' },
  { word: 'bus',    emoji: '🚌', theme: 'other' },
  { word: 'boat',   emoji: '⛵', theme: 'other' },
  { word: 'bike',   emoji: '🚲', theme: 'other' },
  { word: 'train',  emoji: '🚆', theme: 'other' },
  { word: 'plane',  emoji: '✈️', theme: 'other' },
  { word: 'ball',   emoji: '⚽', theme: 'other' },
  { word: 'kite',   emoji: '🪁', theme: 'other' },
  { word: 'drum',   emoji: '🥁', theme: 'other' },
  { word: 'doll',   emoji: '🪆', theme: 'other' },
]

const SAFARI_BY_LEVEL: Record<1 | 2 | 3, readonly ThemeEntry[]> = {
  1: SAFARI_BANK.filter((e) => e.theme === 'animals'),
  2: SAFARI_BANK.filter((e) => e.theme === 'animals' || e.theme === 'fruits'),
  3: SAFARI_BANK,
}

/**
 * Game 2: Word Safari — generates vocabulary matching questions.
 * Level 1: Animals only — Mode A (image→word).
 * Level 2: Animals + Fruits — Dual Mode.
 * Level 3: Full 50-word bank — Dual Mode, 4 choices.
 */
export const generateWordSafariQuestions = (
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): WordSafariQuestion[] => {
  const rng = createRng(seed)
  const pool = SAFARI_BY_LEVEL[level]
  const choiceCount = level === 3 ? 4 : 3
  const selected = pickRandom(pool, Math.min(count, pool.length), rng).slice(0, count)

  return selected.map((entry, i) => {
    const dualMode = level >= 2
    const isWordToImage = dualMode && rng() > 0.5

    if (isWordToImage) {
      // Mode B: show word text → child picks emoji
      const distractorEmojis = pool
        .filter((e) => e.word !== entry.word)
        .sort(() => rng() - 0.5)
        .slice(0, choiceCount - 1)
        .map((e) => e.emoji)
      const choices = [entry.emoji, ...distractorEmojis].sort(() => rng() - 0.5)
      return {
        id: `safari-${i}-${seed}`,
        type: 'word-to-image' as const,
        prompt: entry.word,
        choices,
        correctAnswer: entry.emoji,
        theme: entry.theme,
      }
    } else {
      // Mode A: show emoji → child picks word
      const distractorWords = pool
        .filter((e) => e.word !== entry.word)
        .sort(() => rng() - 0.5)
        .slice(0, choiceCount - 1)
        .map((e) => e.word)
      const choices = [entry.word, ...distractorWords].sort(() => rng() - 0.5)
      return {
        id: `safari-${i}-${seed}`,
        type: 'image-to-word' as const,
        prompt: entry.emoji,
        choices,
        correctAnswer: entry.word,
        theme: entry.theme,
      }
    }
  })
}

// ── Sound Hunt ────────────────────────────────────────────────────────────────

interface PhonemeEntry {
  letter: string
  phonemeHint: string   // bilingual: "/k/ — "c" trong từ "cat""
  words: Array<{ word: string; emoji: string }>
}

const PHONEME_BANK: readonly PhonemeEntry[] = [
  { letter: 'A', phonemeHint: '/æ/ — "a" trong từ "apple"',  words: [{ word: 'apple', emoji: '🍎' }] },
  { letter: 'B', phonemeHint: '/b/ — "b" trong từ "bear"',   words: [{ word: 'bear', emoji: '🐻' }, { word: 'bird', emoji: '🐦' }, { word: 'ball', emoji: '⚽' }] },
  { letter: 'C', phonemeHint: '/k/ — "c" trong từ "cat"',    words: [{ word: 'cat', emoji: '🐱' }, { word: 'cow', emoji: '🐄' }, { word: 'car', emoji: '🚗' }] },
  { letter: 'D', phonemeHint: '/d/ — "d" trong từ "dog"',    words: [{ word: 'dog', emoji: '🐶' }, { word: 'duck', emoji: '🦆' }, { word: 'doll', emoji: '🪆' }] },
  { letter: 'E', phonemeHint: '/ɛ/ — "e" trong từ "egg"',    words: [{ word: 'egg', emoji: '🥚' }] },
  { letter: 'F', phonemeHint: '/f/ — "f" trong từ "fish"',   words: [{ word: 'fish', emoji: '🐟' }, { word: 'frog', emoji: '🐸' }] },
  { letter: 'G', phonemeHint: '/g/ — "g" trong từ "grape"',  words: [{ word: 'grape', emoji: '🍇' }] },
  { letter: 'H', phonemeHint: '/h/ — "h" trong từ "hat"',    words: [{ word: 'hat', emoji: '🎩' }] },
  { letter: 'I', phonemeHint: '/ɪ/ — "i" trong từ "igloo"',  words: [{ word: 'igloo', emoji: '🧊' }] },
  { letter: 'J', phonemeHint: '/dʒ/ — "j" trong từ "jar"',   words: [{ word: 'jar', emoji: '🫙' }] },
  { letter: 'K', phonemeHint: '/k/ — "k" trong từ "kiwi"',   words: [{ word: 'kiwi', emoji: '🥝' }, { word: 'kite', emoji: '🪁' }] },
  { letter: 'L', phonemeHint: '/l/ — "l" trong từ "lion"',   words: [{ word: 'lion', emoji: '🦁' }, { word: 'lemon', emoji: '🍋' }] },
  { letter: 'M', phonemeHint: '/m/ — "m" trong từ "mango"',  words: [{ word: 'mango', emoji: '🥭' }, { word: 'melon', emoji: '🍈' }] },
  { letter: 'N', phonemeHint: '/n/ — "n" trong từ "nut"',    words: [{ word: 'nut', emoji: '🥜' }] },
  { letter: 'O', phonemeHint: '/ɒ/ — "o" trong từ "orange"', words: [{ word: 'orange', emoji: '🍊' }] },
  { letter: 'P', phonemeHint: '/p/ — "p" trong từ "pig"',    words: [{ word: 'pig', emoji: '🐷' }, { word: 'peach', emoji: '🍑' }, { word: 'plum', emoji: '🫐' }] },
  { letter: 'Q', phonemeHint: '/kw/ — "qu" trong từ "queen"',words: [{ word: 'queen', emoji: '👸' }] },
  { letter: 'R', phonemeHint: '/r/ — "r" trong từ "rain"',   words: [{ word: 'rain', emoji: '🌧️' }, { word: 'rock', emoji: '🪨' }] },
  { letter: 'S', phonemeHint: '/s/ — "s" trong từ "sun"',    words: [{ word: 'sun', emoji: '☀️' }, { word: 'star', emoji: '⭐' }, { word: 'snow', emoji: '❄️' }] },
  { letter: 'T', phonemeHint: '/t/ — "t" trong từ "train"',  words: [{ word: 'train', emoji: '🚆' }, { word: 'tree', emoji: '🌳' }] },
  { letter: 'U', phonemeHint: '/ʌ/ — "u" trong từ "umbrella"', words: [{ word: 'umbrella', emoji: '☂️' }] },
  { letter: 'V', phonemeHint: '/v/ — "v" trong từ "van"',    words: [{ word: 'van', emoji: '🚐' }] },
  { letter: 'W', phonemeHint: '/w/ — "w" trong từ "whale"',  words: [{ word: 'whale', emoji: '🐳' }] },
  { letter: 'X', phonemeHint: '/ks/ — "x" trong từ "x-ray"', words: [{ word: 'x-ray', emoji: '🩻' }] },
  { letter: 'Y', phonemeHint: '/j/ — "y" trong từ "yo-yo"',  words: [{ word: 'yo-yo', emoji: '🪀' }] },
  { letter: 'Z', phonemeHint: '/z/ — "z" trong từ "zebra"',  words: [{ word: 'zebra', emoji: '🦓' }] },
]

const PHONEME_BY_GROUP: Record<1 | 2 | 3, readonly string[]> = {
  1: ['B', 'D', 'F', 'G', 'H', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'Z'],
  2: ['B', 'D', 'F', 'G', 'H', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'Z', 'C', 'J', 'K', 'Q', 'W', 'X', 'Y'],
  3: ['B', 'D', 'F', 'G', 'H', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'Z', 'C', 'J', 'K', 'Q', 'W', 'X', 'Y', 'A', 'E', 'I', 'O', 'U'],
}

const PHONEME_MAP = new Map(PHONEME_BANK.map((e) => [e.letter, e]))

/**
 * Game 3: Sound Hunt — generates phonics first-letter-sound questions.
 * Level 1: Group 1 consonants — 3 choices.
 * Level 2: Groups 1+2 — 3 choices, includes tricky consonants.
 * Level 3: All groups — 4 choices, includes short vowels.
 */
export const generateSoundHuntQuestions = (
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): SoundHuntQuestion[] => {
  const rng = createRng(seed)
  const pool = PHONEME_BY_GROUP[level]
  const choiceCount = level === 3 ? 4 : 3
  const selectedLetters = pickRandom(pool, Math.min(count, pool.length), rng).slice(0, count)

  // All emojis available for distractors
  const allEmojis = PHONEME_BANK.flatMap((e) => e.words.map((w) => ({ ...w, letter: e.letter })))

  return selectedLetters.map((letter, i) => {
    const entry = PHONEME_MAP.get(letter)!
    // Pick one word from this letter's words as the correct answer
    const correctWord = entry.words[Math.floor(rng() * entry.words.length)]!

    // Distractors: emojis from other letters, avoiding same starting letter
    const distractorPool = allEmojis.filter((e) => e.letter !== letter)
    const distractors = pickRandom(distractorPool, choiceCount - 1, rng)

    const choices = [correctWord.emoji, ...distractors.map((d) => d.emoji)].sort(() => rng() - 0.5)

    return {
      id: `sound-${i}-${seed}`,
      type: 'sound-hunt' as const,
      targetLetter: letter,
      phonemeHint: entry.phonemeHint,
      choices,
      correctAnswer: correctWord.emoji,
      correctWord: correctWord.word,
    }
  })
}
