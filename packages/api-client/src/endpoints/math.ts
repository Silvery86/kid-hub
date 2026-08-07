import {
  GameBestScoreArraySchema,
  GameSaveResultSchema,
  type SaveMathProgressInput,
  type GameBestScore,
  type GameSaveResult,
} from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const saveMathProgress = async (
  http: HttpTransport,
  input: SaveMathProgressInput
): Promise<GameSaveResult> => GameSaveResultSchema.parse(await http.post('/math', input))

export const getMathBestScores = async (http: HttpTransport): Promise<GameBestScore[]> =>
  GameBestScoreArraySchema.parse(await http.get('/math'))
