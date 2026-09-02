import {
  GameBestScoreArraySchema,
  GameSaveResultSchema,
  type SaveMathProgressInput,
  type GameBestScore,
  type GameSaveResult,
} from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const saveMathProgress = async (
  http: HttpTransport,
  studentId: string,
  input: SaveMathProgressInput
): Promise<GameSaveResult> =>
  GameSaveResultSchema.parse(await http.post(studentPath(studentId, '/math'), input))

export const getMathBestScores = async (
  http: HttpTransport,
  studentId: string
): Promise<GameBestScore[]> =>
  GameBestScoreArraySchema.parse(await http.get(studentPath(studentId, '/math')))
