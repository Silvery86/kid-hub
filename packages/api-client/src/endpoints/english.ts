import {
  GameBestScoreArraySchema,
  GameSaveResultSchema,
  type SaveEnglishProgressInput,
  type GameBestScore,
  type GameSaveResult,
} from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const saveEnglishProgress = async (
  http: HttpTransport,
  input: SaveEnglishProgressInput
): Promise<GameSaveResult> => GameSaveResultSchema.parse(await http.post('/english', input))

export const getEnglishBestScores = async (http: HttpTransport): Promise<GameBestScore[]> =>
  GameBestScoreArraySchema.parse(await http.get('/english'))
