/** Dashboard route group layout — sidebar + UserProgress context + error boundary. */

import { AppSidebar } from '@/components/layout/AppSidebar'
import { UserProgressProviderWrapper } from '@/components/layout/UserProgressProviderWrapper'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProgressProviderWrapper>
      {/* AppSidebar is position:fixed — add offset so content isn't obscured.
          Landscape: pl-16 (sidebar width) → lg:pl-56 (desktop sidebar)
          Portrait:  pb-16 (tab bar height) */}
      <div className="min-h-dvh bg-shell-kid pl-16 portrait:pl-0 lg:pl-56 lg:portrait:pl-0 portrait:pb-16">
        <AppSidebar />
        <div className="overflow-hidden">
          <ErrorBoundary section="dashboard">{children}</ErrorBoundary>
        </div>
      </div>
    </UserProgressProviderWrapper>
  )
}
