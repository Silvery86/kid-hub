import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // Current value
  max?: number // Max value (default 100)
  className?: string
  'aria-label'?: string
}

const getColorClass = (pct: number): string => {
  if (pct >= 90) return 'bg-amber-400'
  if (pct >= 70) return 'bg-blue-400'
  return 'bg-orange-400'
}

export const ProgressBar = ({
  value,
  max = 100,
  className,
  'aria-label': ariaLabel,
}: ProgressBarProps) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
      className={cn('h-4 w-full overflow-hidden rounded-full bg-slate-200', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', getColorClass(pct))}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
