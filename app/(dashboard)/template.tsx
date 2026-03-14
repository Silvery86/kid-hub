/**
 * Dashboard template — remounts on every navigation, triggering the fade-in animation.
 * Unlike layout.tsx (which persists), template.tsx creates a fresh instance per route change.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in anim-duration-300 h-full">{children}</div>;
}
