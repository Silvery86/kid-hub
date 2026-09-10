/**
 * Parent skeleton — every route under /parent.
 *
 * Before this, the whole parent surface navigated to a dead screen: there was no
 * loading.tsx anywhere in the group, so on a cold serverless function a tap sat
 * for well over a second with nothing on the page at all.
 *
 * One file rather than eight. Every parent route lives under `parent/`, so this
 * is the nearest boundary for all of them, and the shape they share — a page
 * title, a subtitle, then a column of cards — is true of each. A per-route
 * skeleton is worth adding only where a distinctive layout makes this one read
 * as a jump, and none of them does yet.
 */

import { Skeleton } from '@/components/ui/Skeleton'

export default function ParentLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
      <div className="mb-5 flex flex-col gap-2">
        <Skeleton height="2rem" width="13rem" />
        <Skeleton height="1rem" width="18rem" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} height="4.5rem" className="rounded-row" />
        ))}
      </div>
    </div>
  )
}
