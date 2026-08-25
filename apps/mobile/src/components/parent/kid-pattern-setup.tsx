// kid-pattern-setup.tsx — web's kid-access/KidPatternSetup.tsx.
//
// Two passes: tap two symbols, then repeat them. A mismatch clears both and
// starts over, so a mistyped pattern can never be saved.

import { KID_PATTERN_LENGTH } from '@kid-hub/shared'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { PressableScale, Shake } from '@/components/ui/animated'
import { useSetKidPattern } from '@/hooks/use-parent'

const SYMBOLS = [
  { id: '1', emoji: '☀️' },
  { id: '2', emoji: '🚌' },
  { id: '3', emoji: '🐶' },
  { id: '4', emoji: '🍎' },
  { id: '5', emoji: '⭐' },
  { id: '6', emoji: '🎈' },
] as const

export function KidPatternSetup() {
  const setPattern = useSetKidPattern()
  const [first, setFirst] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [saved, setSaved] = useState(false)

  const entered = first.length < KID_PATTERN_LENGTH ? first : confirm
  const isBusy = setPattern.isPending || saved

  const reset = (message: string) => {
    setFirst('')
    setConfirm('')
    setError(message)
    setErrorCount((c) => c + 1)
  }

  const handleTap = (symbol: string) => {
    if (isBusy) return

    if (first.length < KID_PATTERN_LENGTH) {
      const next = `${first}${symbol}`
      setFirst(next)
      if (next.length === KID_PATTERN_LENGTH) setError('Xác nhận lại mẫu vừa chọn.')
      return
    }

    const next = `${confirm}${symbol}`
    setConfirm(next)
    if (next.length < KID_PATTERN_LENGTH) return

    if (next !== first) {
      reset('Hai lần chọn không khớp. Vui lòng chọn lại.')
      return
    }

    setPattern.mutate(next, {
      onSuccess: () => {
        setSaved(true)
        setError('')
      },
      onError: () => reset('Không lưu được. Thử lại nhé.'),
    })
  }

  const hint = saved
    ? '✅ Đã lưu mã mở khóa'
    : first.length < KID_PATTERN_LENGTH
      ? `Chọn ${KID_PATTERN_LENGTH} hình · ${first.length}/${KID_PATTERN_LENGTH}`
      : `Xác nhận · ${confirm.length}/${KID_PATTERN_LENGTH}`

  return (
    <View className="gap-3">
      <Text className="font-display-bold text-sm text-text-secondary">{hint}</Text>

      <Shake trigger={errorCount} className="flex-row flex-wrap gap-2">
        {SYMBOLS.map((s) => {
          const isPicked = entered.includes(s.id)
          return (
            <PressableScale
              key={s.id}
              onPress={() => handleTap(s.id)}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={`Hình ${s.id}`}
              className={`min-h-tap-lg items-center justify-center rounded-button border-2 bg-white ${
                isPicked ? 'border-btn-primary' : 'border-border-soft'
              }`}
              style={{ width: '31%', opacity: isBusy ? 0.5 : 1 }}>
              <Text style={{ fontSize: 30 }}>{s.emoji}</Text>
            </PressableScale>
          )
        })}
      </Shake>

      {error ? (
        <Text
          className={`font-display-semibold text-xs ${saved ? 'text-success-strong' : 'text-btn-danger'}`}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
