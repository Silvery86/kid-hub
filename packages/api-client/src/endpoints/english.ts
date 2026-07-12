import type { SaveEnglishProgressInput, GameBestScore, GameSaveResult } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const saveEnglishProgress = (
  http: HttpTransport,
  input: SaveEnglishProgressInput
): Promise<GameSaveResult> => http.post<GameSaveResult>('/english', input)

export const getEnglishBestScores = (http: HttpTransport): Promise<GameBestScore[]> =>
  http.get<GameBestScore[]>('/english')
