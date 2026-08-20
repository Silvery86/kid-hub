// kid-card.tsx — web's ui/KidCard.tsx.

import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

import { shadow } from '@/lib/shadows'
import { PressableScale } from './animated'

interface KidCardProps extends ViewProps {
  children: ReactNode
  /** Renders a pressable card that dips on touch. Web's `isInteractive`. */
  isInteractive?: boolean
  onPress?: () => void
}

const CARD = 'rounded-card bg-white p-6'

export function KidCard({
  children,
  isInteractive = false,
  onPress,
  className = '',
  style,
  ...rest
}: KidCardProps) {
  const classes = `${CARD} ${className}`.trim()

  if (isInteractive) {
    return (
      <PressableScale onPress={onPress} className={classes} style={[shadow('xl'), style]}>
        {children}
      </PressableScale>
    )
  }

  return (
    <View className={classes} style={[shadow('xl'), style]} {...rest}>
      {children}
    </View>
  )
}
