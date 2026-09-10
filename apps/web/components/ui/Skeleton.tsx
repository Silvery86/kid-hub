/**
 * Skeleton — the shape of content that has not arrived yet.
 *
 * Colours come from the semantic tokens (surface-muted / border-soft), never a
 * raw Tailwind palette value. The sweep is a background-position animation, so
 * it costs no layout and stops dead under the reduced-motion guard.
 */

import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
  /** Any CSS width — defaults to filling the container. */
  width?: string
  height?: string
  /** `pill` for avatars and chips. */
  shape?: 'block' | 'pill'
}

const SHEEN =
  'bg-[linear-gradient(90deg,var(--color-surface-muted)_8%,var(--color-border-soft)_32%,var(--color-surface-muted)_56%)] bg-[length:220%_100%] animate-shimmer'

export const Skeleton = ({ className, width, height, shape = 'block' }: SkeletonProps) => (
  <div
    aria-hidden="true"
    style={{ width, height }}
    className={cn(SHEEN, shape === 'pill' ? 'rounded-pill' : 'rounded-chip', className)}
  />
)

/** A paragraph's worth of lines, the last one short like real text. */
export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} height="0.75rem" width={i === lines - 1 ? '55%' : '100%'} />
    ))}
  </div>
)

/** A card-shaped placeholder: icon, title, supporting line. */
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-3 rounded-row bg-white p-4 shadow-sm', className)}>
    <Skeleton shape="pill" width="2.5rem" height="2.5rem" />
    <div className="flex-1">
      <Skeleton height="0.85rem" width="60%" className="mb-2" />
      <Skeleton height="0.7rem" width="40%" />
    </div>
  </div>
)
