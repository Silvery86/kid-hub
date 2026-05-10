'use client'

/**
 * AppSidebar — landscape-first navigation per RESPONSIVE.md §4.
 *
 * Layout:
 *   Landscape (base / P1): fixed left vertical sidebar, icon-only, w-16.
 *   Portrait (P2):         sidebar hidden; PortraitTabBar renders at bottom.
 *   Desktop lg: (P3):     sidebar expands to w-56 with icon + label.
 *
 * The two nav surfaces are CSS-only (no JS state). Only one is ever visible.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Star, Gamepad2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home,     label: 'Home'      },
  { href: '/schedule',  icon: Calendar, label: 'Timetable' },
  { href: '/grades',    icon: Star,     label: 'Grades'    },
  { href: '/games',     icon: Gamepad2, label: 'Games'     },
] as const

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
  variant,
}: {
  href: string
  icon: typeof Home
  label: string
  isActive: boolean
  variant: 'sidebar' | 'tabbar'
}) {
  if (variant === 'sidebar') {
    return (
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-colors',
          'min-h-tap min-w-tap',                              // 48px tap target (P1/P2 rule)
          'lg:flex-row lg:justify-start lg:gap-3 lg:px-4',   // desktop: icon + label inline
          isActive
            ? 'bg-blue-500 text-white shadow-md'
            : 'text-slate-500 hover:bg-sky-100 hover:text-blue-500'
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
        {/* Label hidden below lg: (kid icon-only rule) */}
        <span className="hidden lg:inline text-sm font-semibold">{label}</span>
      </Link>
    )
  }

  // tabbar variant — larger tap targets, label always visible
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
        'min-h-tap-lg',                                       // 64px — portrait tab bar min
        isActive ? 'text-blue-500' : 'text-slate-500'
      )}
    >
      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  )
}

export const AppSidebar = () => {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ── Landscape sidebar (P1 base + P3 desktop) ──────────────────────
          hidden in portrait via portrait:hidden */}
      <aside
        className={cn(
          'portrait:hidden',                                  // P2: hide sidebar
          'fixed left-0 top-0 z-40 h-full safe-left',        // P1: fixed left edge
          'flex w-16 flex-col items-center gap-2 bg-white py-6 shadow-lg',
          'lg:w-56 lg:items-stretch lg:px-3',                 // P3: wider, full labels
        )}
        aria-label="Main navigation"
      >
        {/* Logo mark */}
        <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500 shadow-md lg:h-10 lg:w-10">
          <span className="text-2xl select-none" aria-hidden="true">🌟</span>
        </div>

        {/* Nav items */}
        <nav className="flex w-full flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon, label }) => (
            <NavLink
              key={href}
              href={href}
              icon={icon}
              label={label}
              isActive={isActive(href)}
              variant="sidebar"
            />
          ))}
        </nav>

        {/* Parent switch — bottom of sidebar */}
        <div className="mt-auto w-full">
          <Link
            href="/parent"
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-colors',
              'min-h-tap min-w-tap',
              'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
              'lg:flex-row lg:justify-start lg:gap-3 lg:px-4'
            )}
            aria-label="Switch to parent dashboard"
          >
            <ShieldCheck size={20} strokeWidth={2} aria-hidden="true" />
            <span className="hidden lg:inline text-sm font-medium">Parent</span>
          </Link>
        </div>
      </aside>

      {/* ── Portrait tab bar (P2) ─────────────────────────────────────────
          hidden in landscape via landscape:hidden */}
      <nav
        className={cn(
          'landscape:hidden',                                 // P1: hide tab bar
          'fixed bottom-0 left-0 right-0 z-40 safe-bottom',  // P2: fixed bottom edge
          'flex h-16 items-stretch bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.08)]',
        )}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <NavLink
            key={href}
            href={href}
            icon={icon}
            label={label}
            isActive={isActive(href)}
            variant="tabbar"
          />
        ))}
      </nav>
    </>
  )
}
