/**
 * Parent-mode layout shell.
 * Route protection is handled by middleware.ts — this layout renders only
 * when a valid session cookie has already been verified.
 */

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-dvh bg-slate-50">{children}</div>
}
