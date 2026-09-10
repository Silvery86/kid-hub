'use client'

/**
 * The value from the previous render.
 *
 * Exists because "did this change?" is the trigger for useFlash and for a
 * count-up's origin, and neither can ask that question without it.
 *
 * Implemented by adjusting state during render rather than the older
 * write-a-ref-in-an-effect trick: reading `ref.current` while rendering is what
 * the React Compiler's `react-hooks/refs` rule forbids, and it is genuinely
 * unsafe under concurrent rendering, where a render may be discarded after the
 * ref was already mutated.
 */

import { useState } from 'react'

export const usePrevious = <T,>(value: T): T | undefined => {
  const [seen, setSeen] = useState<{ current: T; previous: T | undefined }>({
    current: value,
    previous: undefined,
  })

  if (!Object.is(seen.current, value)) {
    setSeen({ current: value, previous: seen.current })
  }

  return Object.is(seen.current, value) ? seen.previous : seen.current
}
