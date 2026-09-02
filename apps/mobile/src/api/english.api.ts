// english.api.ts — persist an English session, read best scores (via @kid-hub/api-client).
import type { SaveEnglishProgressInput, GameSaveResult, GameBestScore } from '@kid-hub/shared'

import { studentApi } from './http'

export const saveEnglishProgress = async (input: SaveEnglishProgressInput): Promise<GameSaveResult> =>
  (await studentApi()).saveEnglishProgress(input)

export const getEnglishBestScores = async (): Promise<GameBestScore[]> =>
  (await studentApi()).getEnglishBestScores()
