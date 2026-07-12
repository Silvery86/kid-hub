// math.api.ts — persist a math session, read best scores (via @kid-hub/api-client).
import type { SaveMathProgressInput, GameSaveResult, GameBestScore } from '@kid-hub/shared'

import { apiClient } from './http'

export const saveMathProgress = (input: SaveMathProgressInput): Promise<GameSaveResult> =>
  apiClient.saveMathProgress(input)

export const getMathBestScores = (): Promise<GameBestScore[]> => apiClient.getMathBestScores()
