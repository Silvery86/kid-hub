import type { SaveMathProgressInput, GameBestScore, GameSaveResult } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const saveMathProgress = (
  http: HttpTransport,
  input: SaveMathProgressInput
): Promise<GameSaveResult> => http.post<GameSaveResult>('/math', input)

export const getMathBestScores = (http: HttpTransport): Promise<GameBestScore[]> =>
  http.get<GameBestScore[]>('/math')
