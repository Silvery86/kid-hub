import type { SubjectGrade } from '@/types';
import { calculateBadgeTier } from '@/lib/utils';

/**
 * Khôi's semester 1 seed grades (2025-2026).
 * Scores are on the Vietnamese primary school 0–10 scale.
 */
const RAW_SCORES: Array<{ subjectId: string; score: number }> = [
  { subjectId: 'math',       score: 9.5 },
  { subjectId: 'vietnamese', score: 8.0 },
  { subjectId: 'english',    score: 10  },
  { subjectId: 'science',    score: 7.5 },
  { subjectId: 'ethics',     score: 10  },
  { subjectId: 'pe',         score: 9.0 },
  { subjectId: 'music',      score: 9.0 },
  { subjectId: 'art',        score: 8.5 },
  { subjectId: 'it',         score: 9.5 },
  { subjectId: 'activities', score: 6.5 },
];

export const SEED_GRADES: readonly SubjectGrade[] = RAW_SCORES.map((s) => ({
  subjectId: s.subjectId,
  score: s.score,
  badge: calculateBadgeTier(s.score),
  semester: 1,
  academicYear: '2025-2026',
}));
