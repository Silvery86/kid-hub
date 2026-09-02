// math.api.ts — persist a math session, read best scores (via @kid-hub/api-client).
import type { SaveMathProgressInput, GameSaveResult, GameBestScore } from '@kid-hub/shared'

import { studentApi } from './http'

export const saveMathProgress = async (input: SaveMathProgressInput): Promise<GameSaveResult> =>
  (await studentApi()).saveMathProgress(input)

export const getMathBestScores = async (): Promise<GameBestScore[]> => (await studentApi()).getMathBestScores()
