'use client'

import { useState, useCallback, useEffect } from 'react'

/**
 * useState-like hook that syncs state to localStorage.
 * SSR-safe: uses initialValue during server render; hydrates from storage on mount.
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Hydrate from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T)
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — keep initial value
    }
  }, [key])

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
