/** Games layout — full-screen dark shell for the math and English mini-games. */

import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { UserProgressProviderWrapper } from '@/components/layout/UserProgressProviderWrapper'

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProgressProviderWrapper>
      <div className="game-container min-h-screen bg-slate-900">
        <ErrorBoundary section="games">{children}</ErrorBoundary>
      </div>
    </UserProgressProviderWrapper>
  )
}
