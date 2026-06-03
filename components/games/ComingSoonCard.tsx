/** ComingSoonCard — non-interactive placeholder for future game suites. */

import { cn } from '@/lib/utils'

interface ComingSoonCardProps {
  emoji: string
  name: string
  desc: string
  compact?: boolean
}

export const ComingSoonCard = ({ emoji, name, desc, compact = false }: ComingSoonCardProps) => {
  return (
    <div
      className={cn(
        'relative flex flex-col border-2 border-dashed border-slate-200 bg-white',
        'pointer-events-none cursor-not-allowed select-none opacity-50',
        compact ? 'gap-1.5 rounded-2xl p-3.5' : 'gap-2 rounded-[20px] p-4'
      )}
      aria-disabled="true"
    >
      <span
        className={cn(
          'absolute rounded-full bg-slate-100 font-extrabold tracking-wide text-text-muted',
          compact ? 'right-2 top-2 px-2 py-0.5 text-[10px]' : 'right-2.5 top-2.5 px-2 py-0.5 text-[10px]'
        )}
      >
        Sắp ra mắt
      </span>
      <span className={cn('leading-none', compact ? 'text-[28px]' : 'text-4xl')} aria-hidden="true">
        {emoji}
      </span>
      <div>
        <div
          className={cn('font-black text-slate-600', compact ? 'text-[13px]' : 'text-[15px]')}
        >
          {name}
        </div>
        <div
          className={cn('mt-0.5 font-bold text-text-muted', compact ? 'text-[10px]' : 'text-[11px]')}
        >
          {desc}
        </div>
      </div>
    </div>
  )
}
