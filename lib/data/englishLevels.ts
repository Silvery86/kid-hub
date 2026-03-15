import type { EnglishQuestion } from '@/types';

/**
 * English word bank — 50 curated words pitched at Vietnamese 1st-grade learners.
 * Level 1: letter-matching (fill the missing letter)
 * Level 2: picture-word matching (choose the word shown by the image emoji)
 *
 * imageUrl uses a representative emoji as a stand-in until real image assets exist.
 */

interface WordEntry {
  word: string;
  imageEmoji: string;
  missingIndex: number; // Index of the letter to blank out for Level 1
}

const WORD_BANK: readonly WordEntry[] = [
  { word: 'cat',    imageEmoji: '🐱', missingIndex: 0 },
  { word: 'dog',    imageEmoji: '🐶', missingIndex: 0 },
  { word: 'fish',   imageEmoji: '🐟', missingIndex: 0 },
  { word: 'bird',   imageEmoji: '🐦', missingIndex: 0 },
  { word: 'frog',   imageEmoji: '🐸', missingIndex: 0 },
  { word: 'duck',   imageEmoji: '🦆', missingIndex: 0 },
  { word: 'bear',   imageEmoji: '🐻', missingIndex: 0 },
  { word: 'lion',   imageEmoji: '🦁', missingIndex: 0 },
  { word: 'cow',    imageEmoji: '🐄', missingIndex: 0 },
  { word: 'pig',    imageEmoji: '🐷', missingIndex: 0 },
  { word: 'egg',    imageEmoji: '🥚', missingIndex: 0 },
  { word: 'apple',  imageEmoji: '🍎', missingIndex: 0 },
  { word: 'banana', imageEmoji: '🍌', missingIndex: 0 },
  { word: 'mango',  imageEmoji: '🥭', missingIndex: 0 },
  { word: 'melon',  imageEmoji: '🍈', missingIndex: 0 },
  { word: 'lemon',  imageEmoji: '🍋', missingIndex: 0 },
  { word: 'grape',  imageEmoji: '🍇', missingIndex: 0 },
  { word: 'peach',  imageEmoji: '🍑', missingIndex: 0 },
  { word: 'plum',   imageEmoji: '🫐', missingIndex: 0 },
  { word: 'kiwi',   imageEmoji: '🥝', missingIndex: 0 },
  { word: 'car',    imageEmoji: '🚗', missingIndex: 0 },
  { word: 'bus',    imageEmoji: '🚌', missingIndex: 0 },
  { word: 'boat',   imageEmoji: '⛵', missingIndex: 0 },
  { word: 'bike',   imageEmoji: '🚲', missingIndex: 0 },
  { word: 'train',  imageEmoji: '🚆', missingIndex: 0 },
  { word: 'plane',  imageEmoji: '✈️', missingIndex: 0 },
  { word: 'ball',   imageEmoji: '⚽', missingIndex: 0 },
  { word: 'kite',   imageEmoji: '🪁', missingIndex: 0 },
  { word: 'drum',   imageEmoji: '🥁', missingIndex: 0 },
  { word: 'doll',   imageEmoji: '🪆', missingIndex: 0 },
  { word: 'cake',   imageEmoji: '🎂', missingIndex: 0 },
  { word: 'milk',   imageEmoji: '🥛', missingIndex: 0 },
  { word: 'rice',   imageEmoji: '🍚', missingIndex: 0 },
  { word: 'soup',   imageEmoji: '🍲', missingIndex: 0 },
  { word: 'bread',  imageEmoji: '🍞', missingIndex: 0 },
  { word: 'moon',   imageEmoji: '🌙', missingIndex: 0 },
  { word: 'star',   imageEmoji: '⭐', missingIndex: 0 },
  { word: 'rain',   imageEmoji: '🌧️', missingIndex: 0 },
  { word: 'snow',   imageEmoji: '❄️', missingIndex: 0 },
  { word: 'sun',    imageEmoji: '☀️', missingIndex: 0 },
  { word: 'tree',   imageEmoji: '🌳', missingIndex: 0 },
  { word: 'leaf',   imageEmoji: '🍃', missingIndex: 0 },
  { word: 'rose',   imageEmoji: '🌹', missingIndex: 0 },
  { word: 'seed',   imageEmoji: '🌱', missingIndex: 0 },
  { word: 'rock',   imageEmoji: '🪨', missingIndex: 0 },
  { word: 'hat',    imageEmoji: '🎩', missingIndex: 0 },
  { word: 'book',   imageEmoji: '📖', missingIndex: 0 },
  { word: 'bell',   imageEmoji: '🔔', missingIndex: 0 },
  { word: 'flag',   imageEmoji: '🚩', missingIndex: 0 },
  { word: 'tent',   imageEmoji: '⛺', missingIndex: 0 },
];

/** Pick `count` distinct items from an array using a seeded rng. */
const pickRandom = <T>(arr: readonly T[], count: number, rng: () => number): T[] => {
  const copy = [...arr].sort(() => rng() - 0.5);
  return copy.slice(0, count);
};

const createRng = (seed: number) => {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Level 1 — Letter matching
 * Shows "_ a t" and asks the child to pick the missing first letter.
 * Distractors are nearby alphabet letters.
 */
export const generateLetterMatchQuestions = (
  count: number,
  seed: number = Date.now(),
): EnglishQuestion[] => {
  const rng = createRng(seed);
  const selected = pickRandom(WORD_BANK, count, rng);

  return selected.map((entry, i) => {
    const correct = entry.word[0] ?? 'a';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const idx = alphabet.indexOf(correct);
    const distractors = [
      alphabet[(idx + 1) % 26] ?? 'b',
      alphabet[(idx + 2) % 26] ?? 'c',
      alphabet[Math.abs(idx - 1)] ?? 'd',
    ].filter((l) => l !== correct);

    // Pick 3 unique distractors and shuffle with the correct answer
    const options = [correct, ...distractors.slice(0, 3)].sort(() => rng() - 0.5);
    const prompt = `_ ${entry.word.slice(1).split('').join(' ')}`;

    return {
      id: `letter-${i}-${seed}`,
      type: 'letter-match' as const,
      prompt,
      imageUrl: entry.imageEmoji,
      correctAnswer: correct,
      options,
    };
  });
};

/**
 * Level 2 — Picture-word matching
 * Shows an emoji image and asks the child to pick the correct word from 4 options.
 */
export const generatePictureWordQuestions = (
  count: number,
  seed: number = Date.now(),
): EnglishQuestion[] => {
  const rng = createRng(seed);
  const selected = pickRandom(WORD_BANK, count, rng);

  return selected.map((entry, i) => {
    const distractors = WORD_BANK.filter((w) => w.word !== entry.word)
      .sort(() => rng() - 0.5)
      .slice(0, 3)
      .map((w) => w.word);

    const options = [entry.word, ...distractors].sort(() => rng() - 0.5);

    return {
      id: `picword-${i}-${seed}`,
      type: 'picture-word' as const,
      prompt: entry.imageEmoji,
      imageUrl: entry.imageEmoji,
      correctAnswer: entry.word,
      options,
    };
  });
};
