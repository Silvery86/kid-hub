/** Games layout — dark shell for level select & play; hub pages override with bg-shell-kid. */

import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { UserProgressProviderWrapper } from '@/components/layout/UserProgressProviderWrapper'

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProgressProviderWrapper>
      <div className="game-container h-dvh min-h-0 bg-shell-dark">
        <ErrorBoundary section="games">{children}</ErrorBoundary>
      </div>
    </UserProgressProviderWrapper>
  )
}
