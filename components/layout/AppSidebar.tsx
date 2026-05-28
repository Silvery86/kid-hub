'use client'

/**
 * AppSidebar — matches design/pages shared.jsx + dashboard-v2-responsive.jsx
 *
 * Landscape tablet (P1): w-24 (96px), stacked emoji + label (kh-sidebar).
 * Desktop lg (P3):       w-60 (240px), inline rows (WideSidebar).
 * Portrait (P2):         bottom tab bar with emoji icons.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', emoji: '🏠', label: 'Trang chủ', tabLabel: 'Trang chủ' },
  { href: '/schedule', emoji: '🗓️', label: 'Lịch học', tabLabel: 'Lịch' },
  { href: '/grades', emoji: '⭐', label: 'Điểm số', tabLabel: 'Điểm' },
  { href: '/games', emoji: '🎮', label: 'Trò chơi', tabLabel: 'Trò chơi' },
  { href: '/homework', emoji: '📚', label: 'Bài tập', tabLabel: 'Bài tập' },
  { href: '/unlock', emoji: '🏆', label: 'Huy hiệu', tabLabel: 'Huy hiệu' },
] as const

/** Portrait bottom bar: max 4 items (design/shared.jsx) — homework & badges excluded. */
const TAB_ITEMS = NAV_ITEMS.filter(
  (item) => item.href !== '/homework' && item.href !== '/unlock'
)

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/games') {
    return (
      pathname === '/games' ||
      pathname === '/math' ||
      pathname === '/english' ||
      pathname.startsWith('/math/') ||
      pathname.startsWith('/english/')
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  href,
  emoji,
  label,
  isActive,
  variant,
}: {
  href: string
  emoji: string
  label: string
  isActive: boolean
  variant: 'sidebar' | 'tabbar'
}) {
  if (variant === 'sidebar') {
    return (
      <Link
        href={href}
        data-testid={href === '/games' ? 'nav-link-games' : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex w-full touch-manipulation select-none transition-[transform,background-color,color] duration-150 active:scale-[0.97]',
          'flex-col items-center justify-center gap-1 rounded-2xl py-2 min-h-16',
          'lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-2.5',
          isActive
            ? 'bg-btn-primary text-white shadow-[0_4px_10px_-3px_rgba(59,130,246,0.55)]'
            : 'text-text-secondary hover:bg-shell-kid hover:text-btn-primary'
        )}
      >
        <span className="text-[22px] leading-none lg:text-xl" aria-hidden="true">
          {emoji}
        </span>
        <span className="text-[11px] font-bold leading-tight tracking-tight lg:text-center lg:text-sm lg:font-extrabold">
          {label}
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      data-testid={href === '/games' ? 'nav-link-games' : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors min-h-tap-lg',
        isActive ? 'text-btn-primary' : 'text-text-secondary'
      )}
    >
      <span className="text-[22px] leading-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-[10px] font-extrabold tracking-tight">{label}</span>
    </Link>
  )
}

export const AppSidebar = () => {
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          'portrait:hidden',
          'fixed left-0 top-0 z-40 flex h-full w-24 flex-col safe-left',
          'items-center bg-white py-6',
          'shadow-[4px_0_20px_rgba(15,23,42,0.04)]',
          'lg:w-60 lg:items-stretch lg:px-4 lg:py-5'
        )}
        aria-label="Main navigation"
      >
        {/* Tablet landscape — centered logo (kh-logo) */}
        <div
          className={cn(
            'mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
            'bg-btn-primary text-white shadow-[0_6px_14px_-4px_rgba(59,130,246,0.6)]',
            'lg:hidden'
          )}
        >
          <span className="text-[28px] leading-none select-none" aria-hidden="true">
            🌟
          </span>
        </div>

        {/* Desktop — brand row centered */}
        <div className="mb-4 hidden w-full flex-col items-center gap-2 px-3 lg:flex">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-btn-primary text-white shadow-[0_4px_10px_-3px_rgba(59,130,246,0.55)]">
              <span className="text-xl leading-none select-none" aria-hidden="true">
                🌟
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[15px] font-black leading-tight text-text-primary">Kid Hub</p>
            <p className="text-[11px] font-bold text-text-muted">Lớp 1A · Khôi</p>
          </div>
        </div>

        <nav className="flex w-full flex-col gap-1 px-2 lg:px-3">
          {NAV_ITEMS.map(({ href, emoji, label }) => (
            <NavLink
              key={href}
              href={href}
              emoji={emoji}
              label={label}
              isActive={isNavActive(pathname, href)}
              variant="sidebar"
            />
          ))}
        </nav>

        <div className="mt-auto flex w-full justify-center px-2 pt-2 lg:px-3">
          <Link
            href="/parent"
            aria-label="Switch to parent dashboard"
            className={cn(
              'flex w-full touch-manipulation select-none transition-colors active:scale-[0.97]',
              'flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 py-2 text-text-secondary',
              'hover:bg-shell-light hover:text-text-primary',
              'lg:flex-row lg:justify-start lg:gap-2.5 lg:px-4 lg:py-2.5'
            )}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              🛡️
            </span>
            <span className="text-[11px] font-extrabold lg:text-[13px]">Bố mẹ</span>
          </Link>
        </div>
      </aside>

      <nav
        className={cn(
          'landscape:hidden',
          'fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch bg-white safe-bottom',
          'shadow-[0_-1px_4px_rgba(0,0,0,0.08)]'
        )}
        aria-label="Main navigation"
      >
        {TAB_ITEMS.map(({ href, emoji, tabLabel }) => (
          <NavLink
            key={href}
            href={href}
            emoji={emoji}
            label={tabLabel}
            isActive={isNavActive(pathname, href)}
            variant="tabbar"
          />
        ))}
      </nav>
    </>
  )
}
