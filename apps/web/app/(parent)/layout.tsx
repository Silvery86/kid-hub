/**
 * Parent-mode layout shell.
 * Route protection is handled by middleware.ts — this layout renders only
 * when a valid session cookie has already been verified.
 */

import { ParentBottomNav } from '@/components/parent/ParentBottomNav'
import { ParentSidebarNav } from '@/components/parent/ParentSidebarNav'
import { UserProgressProviderWrapper } from '@/components/layout/UserProgressProviderWrapper'
import { Suspense } from 'react'

import { getParentContextAction } from '@/server/actions/students.actions'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  // Sign-in, PIN and registration live in the (parent-auth) group with their own
  // shell, so every route under this layout has a session. Still resolved
  // defensively, because a session can expire between render and read.
  const { studentName, isAdmin } = await getParentContextAction()

  return (
    <UserProgressProviderWrapper>
      <div className="flex min-h-dvh">
        <Suspense fallback={<div className="hidden w-52 shrink-0 md:flex" />}>
          <ParentSidebarNav studentName={studentName} isAdmin={isAdmin} />
        </Suspense>
        {/* pb clears the fixed mobile nav; the sidebar takes over from md up. */}
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col pb-14 md:pb-0">{children}</div>
      </div>
      <Suspense fallback={null}>
        <ParentBottomNav />
      </Suspense>
    </UserProgressProviderWrapper>
  )
}
