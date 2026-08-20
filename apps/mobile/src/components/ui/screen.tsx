// screen.tsx — the standard screen shell: safe area + shell colour + page padding.
//
// Replaces the per-screen ScrollView/FlatList that currently renders straight
// under the status bar (MOBILE_UI_IMP.md §5.9). Edges default to ['top'] only —
// the tab bar owns the bottom inset, and adding it here double-pads every tab.

import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'

const SHELL = {
  kid: 'bg-shell-kid',
  parent: 'bg-shell-parent',
} as const

/** Web's page padding is p-3 → p-4 → p-5; phones sit at the middle step. */
const PAGE_PADDING = 'px-4 py-3'

interface ScreenProps {
  children: ReactNode
  /** Which shell background to paint. Kid routes are sky, parent routes are sand. */
  variant?: keyof typeof SHELL
  /** Wrap the content in a vertical ScrollView. Off for screens with their own list. */
  scroll?: boolean
  /** Drop the standard page padding — for screens that pad their own list rows. */
  bare?: boolean
  edges?: readonly Edge[]
  className?: string
}

export function Screen({
  children,
  variant = 'kid',
  scroll = false,
  bare = false,
  edges = ['top'],
  className = '',
}: ScreenProps) {
  const padding = bare ? '' : PAGE_PADDING

  return (
    <SafeAreaView edges={edges} className={`flex-1 ${SHELL[variant]}`}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${padding} ${className}`.trim()}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${padding} ${className}`.trim()}>{children}</View>
      )}
    </SafeAreaView>
  )
}
