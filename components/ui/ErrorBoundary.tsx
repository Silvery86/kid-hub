'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. If omitted, the built-in Vietnamese error card is shown. */
  fallback?: ReactNode;
  /**
   * Logical section name — included in console.error for easier debugging.
   * E.g. "games", "dashboard", "parent"
   */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
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
    super(props);
    this.state = { hasError: false };
  }

  // Note: no `override` — React's Component base declares this as an optional static,
  // so TypeScript does not recognise it as an overrideable member (noImplicitOverride does
  // not apply to optional statics in the base class type).
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary:${this.props.section ?? 'app'}]`, error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-[240px] rounded-3xl bg-white p-8 text-center shadow-xl mx-4 my-6"
      >
        <span className="text-7xl mb-4 select-none" aria-hidden="true">
          😵
        </span>
        <h2 className="text-2xl font-extrabold text-slate-700 mb-2">Ối! Có lỗi rồi</h2>
        <p className="text-slate-500 mb-6 text-lg">Khôi thử nhấn nút bên dưới nhé!</p>
        <button
          onClick={this.handleReset}
          className={[
            'min-h-[3.5rem] min-w-[10rem] px-6 py-3',
            'bg-blue-500 text-white rounded-2xl',
            'font-bold text-xl border-4 border-blue-700',
            'active:scale-95 transition-transform duration-100',
            'select-none touch-manipulation',
          ].join(' ')}
        >
          Thử lại 🔄
        </button>
      </div>
    );
  }
}
