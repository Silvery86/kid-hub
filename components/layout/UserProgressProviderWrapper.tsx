'use client';

import { UserProgressProvider } from '@/hooks/useUserProgress';

export const UserProgressProviderWrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProgressProvider>{children}</UserProgressProvider>
);
