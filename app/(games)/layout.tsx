import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full-screen game shell — no sidebar chrome
    <div className="min-h-screen bg-slate-900 game-container">
      <ErrorBoundary section="games">{children}</ErrorBoundary>
    </div>
  );
}
