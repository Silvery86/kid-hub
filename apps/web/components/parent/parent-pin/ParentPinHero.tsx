'use client'

import { cn } from '@/lib/utils'
import type { ParentPinKeypadSize } from './ParentPinKeypad'

const heroSizes = {
  sm: { emoji: 'text-[56px]', title: 'text-[22px]', sub: 'text-[13px]', gap: 'gap-1' },
  md: { emoji: 'text-[80px]', title: 'text-[30px]', sub: 'text-base', gap: 'gap-2' },
  lg: { emoji: 'text-[110px]', title: 'text-[38px]', sub: 'text-lg', gap: 'gap-2.5' },
} as const

export function ParentPinHero({
  icon,
  title,
  subtitle,
  size = 'md',
}: {
  icon: string
  title: string
  subtitle: string
  size?: ParentPinKeypadSize
}) {
  const sz = heroSizes[size]
  return (
    <div className={cn('flex flex-col items-center text-center', sz.gap)}>
      <div className={cn('leading-none', sz.emoji)} aria-hidden="true">
        {icon}
      </div>
      <div className={cn('font-black tracking-tight text-white', sz.title)}>{title}</div>
      <div className={cn('font-bold text-slate-400', sz.sub)}>{subtitle}</div>
    </div>
  )
}
