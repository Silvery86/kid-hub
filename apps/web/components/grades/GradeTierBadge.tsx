'use client'

import { cn } from '@/lib/utils'

const TIER_STYLES = {
  excellent: 'bg-amber-100 text-amber-800 border-amber-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  'needs-practice': 'bg-orange-100 text-orange-800 border-orange-200',
} as const

const TIER_LABELS = {
  excellent: 'Xuất sắc',
  good: 'Giỏi',
  'needs-practice': 'Cần cố gắng',
} as const

export function GradeTierBadge({
  tier,
  compact = false,
}: {
  tier: keyof typeof TIER_STYLES
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        'rounded-full border-2 font-black whitespace-nowrap',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
        TIER_STYLES[tier]
      )}
    >
      {TIER_LABELS[tier]}
    </span>
  )
}
