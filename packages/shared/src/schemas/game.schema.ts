// Zod schemas for game-progress saves — isomorphic (Web actions + Mobile REST).
import { z } from 'zod'

export const SaveMathProgressSchema = z.object({
  minigame: z.enum(['counting', 'addition', 'shapes']),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  correctCount: z.number().int().min(0).max(10),
  incorrectCount: z.number().int().min(0).max(10),
  timeSpentSecs: z.number().int().min(1).max(600),
  homeworkPeriodId: z.string().optional(),
  homeworkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const SaveEnglishProgressSchema = z.object({
  minigame: z.enum(['alphabet', 'vocabulary', 'phonics']),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  correctCount: z.number().int().min(0).max(10),
  incorrectCount: z.number().int().min(0).max(10),
  timeSpentSecs: z.number().int().min(1).max(600),
  homeworkPeriodId: z.string().optional(),
  homeworkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
