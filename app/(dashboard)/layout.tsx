import { AppSidebar } from '@/components/layout/AppSidebar'
import { UserProgressProviderWrapper } from '@/components/layout/UserProgressProviderWrapper'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProgressProviderWrapper>
      <div className="flex min-h-screen bg-sky-50">
        <AppSidebar />
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary section="dashboard">{children}</ErrorBoundary>
        </div>
      </div>
    </UserProgressProviderWrapper>
  )
}
