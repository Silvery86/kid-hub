'use client'

import { useEffect, useRef, useState } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KidButton } from './KidButton'
import { PIN_LENGTH, PIN_SHAKE_DURATION_MS } from '@/lib/constants'

export interface PinKeypadProps {
  pinLength?: number
  onComplete: (pin: string) => void
  /**
   * Increment this counter each time a wrong PIN is submitted.
   * Using a number (not boolean) ensures the useEffect fires reliably
   * even on consecutive errors where the value goes true→false→true
   * in the same render cycle.
   */
  errorCount?: number
  isDisabled?: boolean
  label?: string
}

// Grid order: 1-2-3 / 4-5-6 / 7-8-9 / [blank]-0-[delete]
const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'] as const
type KeypadKey = (typeof KEYPAD_KEYS)[number]

export const PinKeypad = ({
  pinLength = PIN_LENGTH,
  onComplete,
  errorCount = 0,
  isDisabled = false,
  label,
}: PinKeypadProps) => {
  const [value, setValue] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  // Track the previous errorCount so we only react to *new* errors
  const prevErrorCount = useRef(0)

  // Trigger shake animation and clear input whenever errorCount increases
  useEffect(() => {
    if (errorCount === 0 || errorCount === prevErrorCount.current) return
    prevErrorCount.current = errorCount
    setValue('')
    setIsShaking(true)
    const t = setTimeout(() => setIsShaking(false), PIN_SHAKE_DURATION_MS)
    return () => clearTimeout(t)
  }, [errorCount])

  const handleKey = (key: KeypadKey): void => {
    if (isDisabled || key === '') return

    if (key === 'delete') {
      setValue((v) => v.slice(0, -1))
      return
    }

    const next = value + key
    setValue(next)

    if (next.length === pinLength) {
      onComplete(next)
      setValue('')
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {label && <p className="text-2xl font-bold text-slate-700">{label}</p>}

      {/* PIN dot indicators */}
      <div
        className={cn('flex gap-4', isShaking && 'animate-shake')}
        aria-label={`${value.length} of ${pinLength} digits entered`}
        aria-live="polite"
      >
        {Array.from({ length: pinLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-5 w-5 rounded-full border-4 transition-colors duration-150',
              i < value.length ? 'border-blue-500 bg-blue-500' : 'border-slate-400 bg-transparent'
            )}
          />
        ))}
      </div>

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-3" role="group" aria-label="PIN keypad">
        {KEYPAD_KEYS.map((key, idx) => {
          if (key === '') {
            return <div key={idx} aria-hidden="true" />
          }
          return (
            <KidButton
              key={key}
              variant={key === 'delete' ? 'ghost' : 'primary'}
              isDisabled={isDisabled || (key === 'delete' && value.length === 0)}
              onClick={() => handleKey(key)}
              className="min-h-16 min-w-16 text-2xl font-bold"
              aria-label={key === 'delete' ? 'Delete last digit' : key}
            >
              {key === 'delete' ? <Delete size={24} /> : key}
            </KidButton>
          )
        })}
      </div>
    </div>
  )
}
