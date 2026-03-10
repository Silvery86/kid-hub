'use client';

import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface KidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  isDisabled?: boolean;
}

const VARIANT_STYLES: Record<NonNullable<KidButtonProps['variant']>, string> = {
  primary:   'bg-blue-500   border-blue-700   text-white hover:bg-blue-600',
  secondary: 'bg-emerald-400 border-emerald-600 text-white hover:bg-emerald-500',
  danger:    'bg-rose-400   border-rose-600   text-white hover:bg-rose-500',
  ghost:     'bg-white      border-slate-300  text-slate-700 hover:bg-slate-50',
};

export const KidButton = ({
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  children,
  className,
  ...props
}: KidButtonProps) => {
  const shouldDisable = isDisabled || isLoading;

  return (
    <button
      {...props}
      disabled={shouldDisable}
      aria-disabled={shouldDisable}
      className={cn(
        // Base sizing — minimum 64×64px touch target
        'min-h-16 min-w-16 px-6 py-3',
        'flex items-center justify-center gap-2',
        // Visual style
        'rounded-2xl border-4 font-bold text-xl',
        'select-none touch-manipulation',
        // Press animation
        'active:scale-95 transition-transform duration-100',
        // Variant colours
        VARIANT_STYLES[variant],
        // Disabled — CSS + HTML attribute: CSS alone is insufficient for rage-click protection
        shouldDisable && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
    >
      {isLoading ? (
        <span className="animate-spin inline-block w-6 h-6 border-4 border-current border-t-transparent rounded-full" />
      ) : (
        children
      )}
    </button>
  );
};
