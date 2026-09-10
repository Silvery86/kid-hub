/** Grades skeleton — title, semester switcher, then the subject grid. */

import { Skeleton } from '@/components/ui/Skeleton'

export default function GradesLoading() {
  return (
    <div className="flex min-h-dvh flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <Skeleton height="2.5rem" width="8rem" />
      <Skeleton height="2.5rem" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height="6rem" className="rounded-row" />
        ))}
      </div>
    </div>
  )
}
