// http.ts
//
// Binds @kid-hub/api-client to the mobile transport: the existing axios `api`
// instance (Bearer + single-flight refresh from client.ts). Endpoint fetchers
// are consumed via `apiClient`.
import { createApiClient, unwrapEnvelope, type HttpTransport } from '@kid-hub/api-client'

import { api } from './client'

const axiosTransport: HttpTransport = {
  get: async <T>(path: string): Promise<T> => {
    const { data } = await api.get(path)
    return unwrapEnvelope<T>(data)
  },
  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const { data } = await api.post(path, body)
    return unwrapEnvelope<T>(data)
  },
}

export const apiClient = createApiClient(axiosTransport)
