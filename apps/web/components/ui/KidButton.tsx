'use client'

/** KidButton — large touch-friendly button with child-safe visual variants and loading state. */

import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface KidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  isLoading?: boolean
  isDisabled?: boolean
}

const VARIANT_STYLES: Record<NonNullable<KidButtonProps['variant']>, string> = {
  primary: 'bg-btn-primary   border-btn-primary-border   text-white hover:bg-btn-primary-hover',
  secondary: 'bg-btn-secondary border-btn-secondary-border text-white hover:bg-btn-secondary-hover',
  danger: 'bg-btn-danger    border-btn-danger-border    text-white hover:bg-btn-danger-hover',
  ghost: 'bg-white         border-btn-ghost-border     text-text-body hover:bg-shell-light',
}

export const KidButton = ({
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  children,
  className,
  style,
  type = 'button',
  ...props
}: KidButtonProps) => {
  const shouldDisable = isDisabled || isLoading

  return (
    <button
      type={type}
      {...props}
      disabled={shouldDisable}
      aria-disabled={shouldDisable}
      style={{ minHeight: '4rem', minWidth: '4rem', ...style }}
      className={cn(
        'px-6 py-3',
        'flex items-center justify-center gap-2',
        // Visual style
        'rounded-button border-4 text-xl font-bold',
        'touch-manipulation select-none',
        // Press animation
        'transition-transform duration-100 active:scale-95',
        // Variant colours
        VARIANT_STYLES[variant],
        // Disabled — CSS + HTML attribute: CSS alone is insufficient for rage-click protection
        shouldDisable && 'pointer-events-none cursor-not-allowed opacity-50',
        className
      )}
    >
      {isLoading ? (
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  )
}
