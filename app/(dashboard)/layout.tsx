/** Dashboard route group layout — sidebar + UserProgress context + error boundary. */

import { AppSidebar } from '@/components/layout/AppSidebar'
import { UserProgressProviderWrapper } from '@/components/layout/UserProgressProviderWrapper'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ScreenTimeTracker } from '@/components/kid/ScreenTimeTracker'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProgressProviderWrapper>
      <ScreenTimeTracker />
      {/* AppSidebar is position:fixed — offset matches sidebar width (design: 96px / 240px).
          Landscape: pl-24 → lg:pl-60 · Portrait: pb-16 tab bar */}
      <div className="min-h-dvh bg-shell-kid pl-24 portrait:pl-0 lg:pl-60 lg:portrait:pl-0 portrait:pb-16">
        <AppSidebar />
        <div className="overflow-hidden">
          <ErrorBoundary section="dashboard">{children}</ErrorBoundary>
        </div>
      </div>
    </UserProgressProviderWrapper>
  )
}
