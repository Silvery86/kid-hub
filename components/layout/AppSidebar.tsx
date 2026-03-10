'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Star, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home,      label: 'Home' },
  { href: '/schedule',  icon: Calendar,  label: 'Timetable' },
  { href: '/grades',    icon: Star,      label: 'Grades' },
  { href: '/games/math', icon: Gamepad2, label: 'Games' },
] as const;

export const AppSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col items-center gap-2 w-24 min-h-screen bg-white shadow-lg pt-6 pb-4 safe-pad shrink-0">
      {/* App logo mark */}
      <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mb-6 shadow-md">
        <span className="text-3xl select-none" aria-hidden="true">🌟</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 w-full px-2" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-2xl transition-colors',
                'min-h-16 justify-center text-sm font-semibold',
                isActive
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-500 hover:bg-sky-100 hover:text-blue-500',
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
