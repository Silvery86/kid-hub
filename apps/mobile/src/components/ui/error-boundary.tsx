// error-boundary.tsx — web's ui/ErrorBoundary.tsx.
//
// Same API and same Vietnamese fallback. Two platform differences: mobile has
// no Sentry wiring yet, so a caught error is only logged; and "go home" is an
// expo-router replace rather than a location assignment.

import { router } from 'expo-router'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Text, View } from 'react-native'

import { shadow } from '@/lib/shadows'
import { KidButton } from './kid-button'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI. If omitted, the built-in Vietnamese error card is shown. */
  fallback?: ReactNode
  /** Logical section name — included in the log line. E.g. "games", "dashboard". */
  section?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  resetCount: number
}

/** Offer the escape hatch only once retrying has visibly failed. */
const RESETS_BEFORE_HOME = 2

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, resetCount: 0 }
  }

  // No `override` — React declares this as an optional static on the base class,
  // which TypeScript does not treat as an overrideable member.
  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary:${this.props.section ?? 'app'}]`, error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState((s) => ({ hasError: false, resetCount: s.resetCount + 1 }))
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <View
        accessibilityRole="alert"
        className="mx-4 my-6 min-h-[240px] items-center justify-center rounded-card bg-white p-8"
        style={shadow('xl')}>
        <Text className="mb-4 text-7xl">😵</Text>
        <Text className="mb-2 font-display-bold text-2xl text-text-body">Ối! Có lỗi rồi</Text>
        <Text className="mb-6 text-lg text-text-secondary">Khôi thử nhấn nút bên dưới nhé!</Text>
        <View className="items-center gap-3">
          <KidButton onPress={this.handleReset}>Thử lại 🔄</KidButton>
          {this.state.resetCount >= RESETS_BEFORE_HOME && (
            <KidButton variant="ghost" onPress={() => router.replace('/')}>
              Về trang chủ 🏠
            </KidButton>
          )}
        </View>
      </View>
    )
  }
}
