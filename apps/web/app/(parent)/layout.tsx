/**
 * Parent-mode layout shell.
 * Route protection is handled by middleware.ts — this layout renders only
 * when a valid session cookie has already been verified.
 */

import { ParentSidebarNav } from '@/components/parent/ParentSidebarNav'
import { UserProgressProviderWrapper } from '@/components/layout/UserProgressProviderWrapper'
import { Suspense } from 'react'

import { getParentContextAction } from '@/server/actions/students.actions'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  // Resolves to safe defaults on the signed-out screens (login, register, pin),
  // which share this shell but have no session to read.
  const { studentName, isAdmin } = await getParentContextAction()

  return (
    <UserProgressProviderWrapper>
      <div className="flex min-h-dvh">
        <Suspense fallback={<div className="hidden w-52 shrink-0 md:flex" />}>
          <ParentSidebarNav studentName={studentName} isAdmin={isAdmin} />
        </Suspense>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </UserProgressProviderWrapper>
  )
}
