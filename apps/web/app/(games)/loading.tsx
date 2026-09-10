/**
 * Games skeleton — on the dark shell the layout already paints.
 *
 * The group had none, so entering a game from the hub showed the previous screen
 * until the route resolved. Sized to the play area rather than a list, because
 * that is what arrives.
 */

import { Skeleton } from '@/components/ui/Skeleton'

export default function GamesLoading() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-shell-dark p-6">
      <Skeleton height="1.75rem" width="9rem" className="opacity-25" />
      <Skeleton height="14rem" width="min(28rem, 100%)" className="rounded-card opacity-25" />
      <div className="flex gap-3">
        <Skeleton height="3.5rem" width="7rem" className="rounded-button opacity-25" />
        <Skeleton height="3.5rem" width="7rem" className="rounded-button opacity-25" />
      </div>
    </div>
  )
}
