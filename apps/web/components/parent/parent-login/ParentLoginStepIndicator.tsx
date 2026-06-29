'use client'

import { cn } from '@/lib/utils'

export type ParentLoginStep = 'email' | 'welcome' | 'create' | 'confirm' | 'success'

const STEPS: { id: ParentLoginStep; n: number }[] = [
  { id: 'email', n: 1 },
  { id: 'welcome', n: 2 },
  { id: 'create', n: 3 },
  { id: 'confirm', n: 4 },
  { id: 'success', n: 5 },
]

export function ParentLoginStepIndicator({
  step,
  compact = false,
}: {
  step: ParentLoginStep
  compact?: boolean
}) {
  const cur = STEPS.findIndex((s) => s.id === step)
  const dot = compact ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'
  const gap = compact ? 'gap-1.5' : 'gap-2.5'

  return (
    <div className={cn('flex w-full max-w-md items-center', gap)}>
      {STEPS.map((s, i) => {
        const done = i < cur
        const active = i === cur
        return (
          <div key={s.id} className="contents">
            {i > 0 ? (
              <div
                className={cn(
                  'h-0.5 min-w-4 flex-1 rounded-full',
                  done ? 'bg-blue-500' : 'bg-white/15'
                )}
              />
            ) : null}
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-black transition-colors',
                dot,
                active && 'border-[3px] border-blue-300 bg-blue-500 text-white',
                done && !active && 'bg-blue-800 text-white',
                !active && !done && 'bg-white/10 text-white/40'
              )}
            >
              {done ? '✓' : s.n}
            </div>
          </div>
        )
      })}
    </div>
  )
}
