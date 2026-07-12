import type { ActionResult } from '@kid-hub/shared'

/**
 * Transport the API client is built on. Web injects `fetch` (see
 * `createFetchTransport`); Mobile injects its axios client (which handles the
 * Bearer token + single-flight refresh). Implementations unwrap the
 * `{ success, data }` envelope and throw an Error on failure.
 */
export interface HttpTransport {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
}

export interface FetchTransportOptions {
  /** Base URL including the `/api/v1` prefix, e.g. `https://host/api/v1`. */
  baseUrl: string
  /** Optional bearer-token provider (sync or async). */
  getAuthToken?: () => string | null | Promise<string | null>
}

/** Unwrap the standard `{ success, data }` response envelope, throwing on failure. */
export const unwrapEnvelope = <T>(body: unknown): T => {
  if (body && typeof body === 'object' && 'success' in body) {
    const env = body as ActionResult<T>
    if (!env.success) throw new Error(env.error || 'Request failed')
    return env.data
  }
  return body as T
}

/** A `fetch`-based transport — isomorphic (browser, React Native, Node ≥18). */
export const createFetchTransport = (opts: FetchTransportOptions): HttpTransport => {
  const request = async <T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> => {
    const token = opts.getAuthToken ? await opts.getAuthToken() : null
    const res = await fetch(`${opts.baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const json = res.status === 204 ? undefined : await res.json().catch(() => undefined)
    if (!res.ok) {
      const message = (json as { error?: string } | undefined)?.error ?? `HTTP ${res.status}`
      throw new Error(message)
    }
    return unwrapEnvelope<T>(json)
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
  }
}
