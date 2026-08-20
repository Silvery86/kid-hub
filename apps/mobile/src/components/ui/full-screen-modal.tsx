// full-screen-modal.tsx — web's ui/FullScreenModal.tsx.
//
// RN's Modal replaces createPortal: it already renders above the tree, traps
// focus and locks scrolling, so web's body-overflow effect has no counterpart.
// `statusBarTranslucent` is what makes the scrim reach under the status bar,
// which is web's `safe-top` on a full-bleed overlay.

import type { ReactNode } from 'react'
import { Modal, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'

import { tokens } from '@kid-hub/shared'
import { shadow } from '@/lib/shadows'
import { PressableScale } from './animated'

interface FullScreenModalProps {
  isOpen: boolean
  onClose?: () => void
  hasCloseButton?: boolean
  children: ReactNode
  className?: string
}

export function FullScreenModal({
  isOpen,
  onClose,
  hasCloseButton = true,
  children,
  className = '',
}: FullScreenModalProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60">
        <SafeAreaView edges={['top']} className={`h-full w-full ${className}`.trim()}>
          {hasCloseButton && onClose && (
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="absolute top-4 right-4 z-10 h-14 w-14 items-center justify-center rounded-pill bg-white/90"
              style={shadow('lg')}>
              <X size={28} color={tokens.colors['text-primary']} />
            </PressableScale>
          )}
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  )
}
