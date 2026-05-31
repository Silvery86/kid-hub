/**
 * Parent-mode layout shell.
 * Route protection is handled by middleware.ts — this layout renders only
 * when a valid session cookie has already been verified.
 */

import { ParentSidebarNav } from '@/components/parent/ParentSidebarNav'
import { Suspense } from 'react'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Suspense fallback={<div className="hidden w-52 shrink-0 md:flex" />}>
        <ParentSidebarNav />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
