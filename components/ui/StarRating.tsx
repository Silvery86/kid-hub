import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: 1 | 2 | 3
  max?: number
  className?: string
}

export const StarRating = ({ value, max = 3, className }: StarRatingProps) => (
  <div
    className={cn('flex gap-2', className)}
    aria-label={`${value} out of ${max} stars`}
    role="img"
  >
    {Array.from({ length: max }).map((_, i) => (
      <span
        key={i}
        className={cn(
          'text-4xl transition-colors duration-150',
          i < value ? 'text-amber-400' : 'text-slate-300'
        )}
        aria-hidden="true"
      >
        ★
      </span>
    ))}
  </div>
)
