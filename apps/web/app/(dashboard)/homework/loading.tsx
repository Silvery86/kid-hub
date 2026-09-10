/** Homework skeleton — a title and four task rows. */

import { Skeleton } from '@/components/ui/Skeleton'

export default function HomeworkLoading() {
  return (
    <div className="flex min-h-dvh flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <Skeleton height="2.5rem" width="10rem" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} height="4rem" className="rounded-row" />
        ))}
      </div>
    </div>
  )
}
