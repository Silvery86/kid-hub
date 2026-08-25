// Parent PIN — web's parent/pin (ParentPinScreen).
//
// The second factor in front of the management screens. The caller already
// holds a parent token from login, so this gates the UI; the hash, the attempt
// counter and the lockout live behind POST /api/v1/auth/pin.
import { PIN_LENGTH } from '@kid-hub/shared'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { verifyParentPin } from '@/api/parent.api'
import { PinKeypad } from '@/components/ui/pin-keypad'
import { Screen } from '@/components/ui/screen'
import { useParentGate } from '@/hooks/use-parent-gate'

/** Server default when a lockout response omits the duration. */
const FALLBACK_LOCKOUT_SECONDS = 30

export default function ParentPinScreen() {
  const router = useRouter()
  const { verify } = useParentGate()

  const [error, setError] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLocked = lockoutSeconds > 0

  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const t = setInterval(() => setLockoutSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [lockoutSeconds])

  const handleComplete = async (pin: string) => {
    setIsSubmitting(true)
    try {
      const result = await verifyParentPin(pin)

      if (result.status === 'ok') {
        verify()
        router.replace('/parent')
        return
      }
      if (result.status === 'not-configured') {
        setError('Chưa cài đặt mã PIN. Hãy đăng nhập lại để tạo.')
        return
      }
      if (result.status === 'locked') {
        setLockoutSeconds(result.lockoutSeconds ?? FALLBACK_LOCKOUT_SECONDS)
        setError('Nhập sai quá nhiều lần.')
      } else {
        setError('Mã PIN chưa đúng.')
      }
      setErrorCount((c) => c + 1)
    } catch {
      setError('Không kết nối được. Thử lại nhé.')
      setErrorCount((c) => c + 1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen variant="parent">
      <View className="flex-1 items-center justify-center gap-6">
        <View className="items-center">
          <Text style={{ fontSize: 64 }}>🛡️</Text>
          <Text className="mt-2 font-display-extrabold text-2xl text-text-primary">Khu vực bố mẹ</Text>
          <Text className="mt-1 font-display-bold text-sm text-text-secondary">
            Nhập mã PIN {PIN_LENGTH} số để tiếp tục
          </Text>
        </View>

        <PinKeypad
          onComplete={(pin) => void handleComplete(pin)}
          errorCount={errorCount}
          isDisabled={isLocked || isSubmitting}
        />

        {isLocked ? (
          <Text className="font-display-extrabold text-sm text-btn-danger">
            Thử lại sau {lockoutSeconds}s
          </Text>
        ) : error ? (
          <Text className="font-display-bold text-sm text-btn-danger">{error}</Text>
        ) : null}
      </View>
    </Screen>
  )
}
