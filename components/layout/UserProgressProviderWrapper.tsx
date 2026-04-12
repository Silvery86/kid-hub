'use client'

/** UserProgressProviderWrapper — thin client boundary that wraps children in UserProgressProvider. */

import { UserProgressProvider } from '@/hooks/useUserProgress'

export const UserProgressProviderWrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProgressProvider>{children}</UserProgressProvider>
)
