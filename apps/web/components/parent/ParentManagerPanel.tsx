'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ParentManagerPanel({
  title,
  action,
  children,
  compact = false,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-white shadow-sm',
        compact ? 'gap-2.5 p-3.5' : 'gap-3.5 p-5',
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2
          className={cn(
            'm-0 font-black text-slate-600',
            compact ? 'text-base' : 'text-xl'
          )}
        >
          {title}
        </h2>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
