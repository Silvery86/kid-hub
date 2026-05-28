'use client'

/** localStorage hook — SSR-safe useState that syncs to localStorage on mount. */

import { useState, useCallback, useEffect } from 'react'

/**
 * useState-like hook that syncs state to localStorage.
 * SSR-safe: always starts with initialValue so server and client first-render match,
 * then reads from localStorage in useEffect after mount.
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) setStoredValue(JSON.parse(item) as T)
    } catch {
      // ignore read errors
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
