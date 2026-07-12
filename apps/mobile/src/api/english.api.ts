// english.api.ts — persist an English session, read best scores (via @kid-hub/api-client).
import type { SaveEnglishProgressInput, GameSaveResult, GameBestScore } from '@kid-hub/shared'

import { apiClient } from './http'

export const saveEnglishProgress = (input: SaveEnglishProgressInput): Promise<GameSaveResult> =>
  apiClient.saveEnglishProgress(input)

export const getEnglishBestScores = (): Promise<GameBestScore[]> =>
  apiClient.getEnglishBestScores()
