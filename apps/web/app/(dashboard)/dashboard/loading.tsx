/** Dashboard skeleton — the shape of the page while the DB query resolves. */

import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-dvh flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <Skeleton height="2.5rem" width="10rem" />
      <Skeleton height="7rem" className="rounded-card" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton height="5rem" className="rounded-row" />
        <Skeleton height="5rem" className="rounded-row" />
        <Skeleton height="5rem" className="rounded-row" />
      </div>
      <Skeleton className="flex-1 rounded-row" />
    </div>
  )
}
