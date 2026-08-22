// profile.api.ts — GET the kid's display profile (via @kid-hub/api-client).
import type { KidProfile } from '@kid-hub/shared'

import { apiClient } from './http'

export const getKidProfile = (): Promise<KidProfile> => apiClient.getKidProfile()
