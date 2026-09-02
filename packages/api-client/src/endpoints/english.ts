import {
  GameBestScoreArraySchema,
  GameSaveResultSchema,
  type SaveEnglishProgressInput,
  type GameBestScore,
  type GameSaveResult,
} from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const saveEnglishProgress = async (
  http: HttpTransport,
  studentId: string,
  input: SaveEnglishProgressInput
): Promise<GameSaveResult> =>
  GameSaveResultSchema.parse(await http.post(studentPath(studentId, '/english'), input))

export const getEnglishBestScores = async (
  http: HttpTransport,
  studentId: string
): Promise<GameBestScore[]> =>
  GameBestScoreArraySchema.parse(await http.get(studentPath(studentId, '/english')))
