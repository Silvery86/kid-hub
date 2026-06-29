'use client'

import { cn } from '@/lib/utils'
import type { KidAccessFeature } from '@/lib/data/kid-access'

export function AccessToggleRow({
  feature,
  enabled,
  onToggle,
  compact = false,
}: {
  feature: KidAccessFeature
  enabled: boolean
  onToggle: () => void
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[18px] bg-slate-50',
        compact ? 'px-3 py-2.5' : 'px-4 py-3'
      )}
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-[13px] text-xl',
          compact ? 'h-9 w-9 rounded-[10px] text-lg' : 'h-11 w-11',
          enabled ? 'bg-blue-100' : 'bg-slate-200'
        )}
        aria-hidden="true"
      >
        {feature.icon}
      </div>
      <div className="min-w-0 flex-1 text-sm font-black text-slate-800 md:text-base">
        {feature.label}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          'relative shrink-0 rounded-full border-0 p-0 transition-colors',
          compact ? 'h-[26px] w-11' : 'h-[30px] w-[52px]',
          enabled ? 'bg-btn-primary' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] block rounded-full bg-white shadow-md transition-[left]',
            compact ? 'h-5 w-5' : 'h-6 w-6',
            enabled ? (compact ? 'left-[21px]' : 'left-[25px]') : 'left-[3px]'
          )}
        />
      </button>
    </div>
  )
}
