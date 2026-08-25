// kid-button.tsx — web's ui/KidButton.tsx.
//
// Web's hover variants have no touch equivalent and are dropped; the press dip
// comes from PressableScale, which is the native reading of `active:scale-95`.

import type { ReactNode } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import { PressableScale } from './animated'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANT_STYLES: Record<Variant, { container: string; label: string; spinner: string }> = {
  primary: { container: 'bg-btn-primary border-btn-primary-border', label: 'text-white', spinner: '#ffffff' },
  secondary: { container: 'bg-btn-secondary border-btn-secondary-border', label: 'text-white', spinner: '#ffffff' },
  danger: { container: 'bg-btn-danger border-btn-danger-border', label: 'text-white', spinner: '#ffffff' },
  ghost: { container: 'bg-white border-btn-ghost-border', label: 'text-text-body', spinner: '#334155' },
}

interface KidButtonProps {
  children?: ReactNode
  onPress?: () => void
  variant?: Variant
  isLoading?: boolean
  isDisabled?: boolean
  /** Spoken by the screen reader when the label is an icon or a bare digit. */
  accessibilityLabel?: string
  className?: string
}

export function KidButton({
  children,
  onPress,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  accessibilityLabel,
  className = '',
}: KidButtonProps) {
  const shouldDisable = isDisabled || isLoading
  const { container, label, spinner } = VARIANT_STYLES[variant]

  return (
    <PressableScale
      onPress={shouldDisable ? undefined : onPress}
      disabled={shouldDisable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: shouldDisable }}
      className={`min-h-tap-lg min-w-tap-lg flex-row items-center justify-center gap-2 rounded-button border-4 px-6 py-3 ${container} ${shouldDisable ? 'opacity-50' : ''} ${className}`.trim()}>
      {isLoading ? (
        <ActivityIndicator color={spinner} />
      ) : typeof children === 'string' || typeof children === 'number' ? (
        <Text className={`font-display-extrabold text-xl ${label}`}>{children}</Text>
      ) : (
        <View className="flex-row items-center gap-2">{children}</View>
      )}
    </PressableScale>
  )
}
