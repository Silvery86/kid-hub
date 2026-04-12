'use client'

/** AppSidebar — sticky bottom navigation bar with active-route highlighting. */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Star, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/schedule', icon: Calendar, label: 'Timetable' },
  { href: '/grades', icon: Star, label: 'Grades' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
] as const

export const AppSidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="safe-pad flex min-h-screen w-24 shrink-0 flex-col items-center gap-2 bg-white pt-6 pb-4 shadow-lg">
      {/* App logo mark */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-md">
        <span className="text-3xl select-none" aria-hidden="true">
          🌟
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex w-full flex-col gap-1 px-2" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl p-3 transition-colors',
                'min-h-16 justify-center text-sm font-semibold',
                isActive
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-500 hover:bg-sky-100 hover:text-blue-500'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
