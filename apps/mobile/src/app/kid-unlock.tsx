// Kid unlock — web's /kid-unlock (components/unlock/KidUnlockScreen.tsx).
//
// Web's version issues a KID_SESSION_COOKIE that its middleware enforces. Mobile
// cannot do that: the API is Bearer-token authenticated and /api/v1/* is outside
// the middleware matcher, so the token already grants access before a pattern is
// entered. This gates the UI instead — see hooks/use-kid-gate.ts — while the
// hash, the attempt counter and the lockout stay on the server.
import { KID_PATTERN_LENGTH, tokens } from '@kid-hub/shared'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getKidPatternStatus, verifyKidPattern } from '@/api/kid-pattern.api'
import { PressableScale, Shake } from '@/components/ui/animated'
import { useKidGate } from '@/hooks/use-kid-gate'

const TILES = [
  { id: '1', emoji: '☀️', label: 'Sun' },
  { id: '2', emoji: '🚌', label: 'Bus' },
  { id: '3', emoji: '🐶', label: 'Dog' },
  { id: '4', emoji: '🍎', label: 'Apple' },
  { id: '5', emoji: '⭐', label: 'Star' },
  { id: '6', emoji: '🎈', label: 'Balloon' },
] as const

/** Server default when a lockout response omits the duration. */
const FALLBACK_LOCKOUT_SECONDS = 30

export default function KidUnlockScreen() {
  const router = useRouter()
  const { unlock } = useKidGate()

  const [entered, setEntered] = useState('')
  const [error, setError] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  const isLocked = lockoutSeconds > 0

  useEffect(() => {
    let active = true
    getKidPatternStatus()
      .then(({ hasKidPatternSet }) => {
        if (!active) return
        if (!hasKidPatternSet) {
          // Nothing to unlock against — let the kid through rather than trap them.
          unlock()
          router.replace('/(tabs)/dashboard')
        }
      })
      .catch(() => {
        if (active) setError('Không kết nối được. Thử lại nhé!')
      })
    return () => {
      active = false
    }
  }, [router, unlock])

  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const timer = setInterval(() => setLockoutSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [lockoutSeconds])

  const hint = useMemo(
    () => (isLocked ? `Vui lòng thử lại sau ${lockoutSeconds}s` : `${entered.length}/${KID_PATTERN_LENGTH}`),
    [entered.length, isLocked, lockoutSeconds]
  )

  const submitPattern = async (pattern: string) => {
    setIsSubmitting(true)
    try {
      const result = await verifyKidPattern(pattern)

      if (result.status === 'ok') {
        unlock()
        router.replace('/(tabs)/dashboard')
        return
      }
      if (result.status === 'not-configured') {
        setNeedsSetup(true)
        setError('Bố mẹ chưa thiết lập mã mở khóa.')
        return
      }
      if (result.status === 'locked') {
        setLockoutSeconds(result.lockoutSeconds ?? FALLBACK_LOCKOUT_SECONDS)
        setError('Đã nhập sai quá nhiều lần.')
      } else {
        setError('Mã mở khóa chưa đúng, thử lại nhé!')
      }
      setEntered('')
      setErrorCount((c) => c + 1)
    } catch {
      setEntered('')
      setError('Không kết nối được. Thử lại nhé!')
      setErrorCount((c) => c + 1)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTap = (id: string) => {
    if (isLocked || isSubmitting || needsSetup) return
    const next = `${entered}${id}`
    setEntered(next)
    setError('')
    if (next.length === KID_PATTERN_LENGTH) void submitPattern(next)
  }

  const disabled = isLocked || isSubmitting || needsSetup

  return (
    <LinearGradient
      // Web paints a radial sky-to-navy wash; a vertical linear ramp is the
      // closest RN equivalent (§6's gradient translation rule).
      colors={['#e0f2fe', '#bfdbfe', tokens.colors['shell-dark']]}
      locations={[0, 0.35, 1]}
      style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 items-center justify-center px-4 py-8">
        <View className="w-full max-w-md">
          <View className="mb-6 items-center">
            <Text className="mb-3" style={{ fontSize: 64 }}>
              🔓
            </Text>
            <Text className="font-display-extrabold text-3xl text-white">Mở khóa cho bé</Text>
            <Text className="mt-2 font-display-bold text-sm text-text-subtle">
              Chạm {KID_PATTERN_LENGTH} hình theo đúng thứ tự đã cài đặt
            </Text>
            <Text className="mt-3 font-display-extrabold text-sm text-math-light">{hint}</Text>
          </View>

          <Shake trigger={errorCount} className="flex-row flex-wrap gap-3">
            {TILES.map((tile) => (
              <PressableScale
                key={tile.id}
                onPress={() => handleTap(tile.id)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={tile.label}
                accessibilityState={{ disabled }}
                className="min-h-24 items-center justify-center rounded-button border-2 border-white/20 bg-white/10"
                style={{ width: '30%', opacity: disabled ? 0.5 : 1 }}>
                <Text style={{ fontSize: 36 }}>{tile.emoji}</Text>
              </PressableScale>
            ))}
          </Shake>

          {error ? (
            <Text className="mt-4 text-center font-display-bold text-sm text-btn-danger">
              {error}
            </Text>
          ) : (
            <Text className="mt-4 text-center font-display-bold text-xs text-text-secondary">
              Nhấn nút Bố mẹ để vào khu quản lý
            </Text>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}
