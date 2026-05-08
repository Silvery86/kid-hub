'use client'

/** localStorage hook — SSR-safe useState that syncs to localStorage on mount. */

import { useState, useCallback } from 'react'

/**
 * useState-like hook that syncs state to localStorage.
 * SSR-safe: uses initialValue during server render; hydrates from storage on mount.
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // Ignore write errors (quota exceeded, etc.)
        }
        return next
      })
    },
    [key]
  )

  return [storedValue, setValue]
}
