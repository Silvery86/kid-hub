// pin-keypad.tsx — web's ui/PinKeypad.tsx.

import { PIN_LENGTH, tokens } from '@kid-hub/shared'
import { Delete } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'

import { Shake } from './animated'
import { KidButton } from './kid-button'

// Grid order: 1-2-3 / 4-5-6 / 7-8-9 / [blank]-0-[delete].
// RN has no CSS grid, so the rows are explicit; each cell is flex-1 so the
// wider delete key cannot push the column widths out of alignment.
const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'delete'],
] as const
type KeypadKey = (typeof KEYPAD_ROWS)[number][number]

interface PinKeypadProps {
  pinLength?: number
  onComplete: (pin: string) => void
  /**
   * Increment this counter each time a wrong PIN is submitted. A number rather
   * than a boolean so consecutive errors both fire — true→false→true inside one
   * render cycle would not.
   */
  errorCount?: number
  isDisabled?: boolean
  label?: string
}

export function PinKeypad({
  pinLength = PIN_LENGTH,
  onComplete,
  errorCount = 0,
  isDisabled = false,
  label,
}: PinKeypadProps) {
  const [value, setValue] = useState('')
  const previousErrorCount = useRef(0)

  // Clear the entry on each new error; <Shake> reacts to the same counter.
  useEffect(() => {
    if (errorCount === 0 || errorCount === previousErrorCount.current) return
    previousErrorCount.current = errorCount
    const t = setTimeout(() => setValue(''), 0)
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
    <View className="items-center gap-6">
      {label ? <Text className="font-display-bold text-2xl text-text-body">{label}</Text> : null}

      <Shake
        trigger={errorCount}
        className="flex-row gap-4"
        accessibilityLabel={`${value.length} of ${pinLength} digits entered`}>
        {Array.from({ length: pinLength }).map((_, i) => (
          <View
            key={i}
            className={`h-5 w-5 rounded-pill border-4 ${
              i < value.length ? 'border-btn-primary bg-btn-primary' : 'border-border-muted'
            }`}
          />
        ))}
      </Shake>

      <View className="w-full max-w-[320px] gap-3">
        {KEYPAD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-3">
            {row.map((key, cellIndex) =>
              key === '' ? (
                <View key={`blank-${cellIndex}`} className="min-h-tap-lg flex-1" />
              ) : (
                <KidButton
                  key={key}
                  variant={key === 'delete' ? 'ghost' : 'primary'}
                  isDisabled={isDisabled || (key === 'delete' && value.length === 0)}
                  onPress={() => handleKey(key)}
                  accessibilityLabel={key === 'delete' ? 'Delete last digit' : key}
                  className="flex-1">
                  {key === 'delete' ? <Delete size={24} color={tokens.colors['text-body']} /> : key}
                </KidButton>
              )
            )}
          </View>
        ))}
      </View>
    </View>
  )
}
