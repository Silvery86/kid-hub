'use client'

/** ErrorBoundary — React class boundary that catches render errors and shows a fallback UI. */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI. If omitted, the built-in Vietnamese error card is shown. */
  fallback?: ReactNode
  /**
   * Logical section name — included in console.error for easier debugging.
   * E.g. "games", "dashboard", "parent"
   */
  section?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  resetCount: number
}

/**
 * React error boundary for catching and displaying render-phase errors.
 *
 * Usage:
 *   <ErrorBoundary section="games">
 *     <MathGame />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, resetCount: 0 }
  }

  // Note: no `override` — React's Component base declares this as an optional static,
  // so TypeScript does not recognise it as an overrideable member (noImplicitOverride does
  // not apply to optional statics in the base class type).
  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack, section: this.props.section },
    })
    console.error(`[ErrorBoundary:${this.props.section ?? 'app'}]`, error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState((s) => ({ hasError: false, resetCount: s.resetCount + 1 }))
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        className="mx-4 my-6 flex min-h-[240px] flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-xl"
      >
        <span className="mb-4 text-7xl select-none" aria-hidden="true">
          😵
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-slate-700">Ối! Có lỗi rồi</h2>
        <p className="mb-6 text-lg text-slate-500">Khôi thử nhấn nút bên dưới nhé!</p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={this.handleReset}
            style={{ minHeight: '3.5rem', minWidth: '10rem' }}
            className={[
              'rounded-2xl bg-blue-500 px-6 py-3 text-white',
              'border-4 border-blue-700 text-xl font-bold',
              'transition-transform duration-100 active:scale-95',
              'touch-manipulation select-none',
            ].join(' ')}
          >
            Thử lại 🔄
          </button>
          {this.state.resetCount >= 2 && (
            <button
              type="button"
              onClick={() => { window.location.href = '/' }}
              style={{ minHeight: '3rem', minWidth: '10rem' }}
              className={[
                'rounded-2xl bg-slate-100 px-6 py-3 text-slate-700',
                'border-2 border-slate-300 text-base font-bold',
                'transition-transform duration-100 active:scale-95',
                'touch-manipulation select-none',
              ].join(' ')}
            >
              Về trang chủ 🏠
            </button>
          )}
        </div>
      </div>
    )
  }
}
