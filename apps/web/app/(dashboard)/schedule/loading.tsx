/** Schedule skeleton — header, day switcher, then the timeline. */

import { Skeleton } from '@/components/ui/Skeleton'

export default function ScheduleLoading() {
  return (
    <div className="flex h-dvh flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <Skeleton height="2.5rem" width="12rem" />
      <Skeleton height="3rem" className="rounded-card" />
      <Skeleton className="min-h-0 flex-1 rounded-row" />
    </div>
  )
}
