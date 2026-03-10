import { cn } from '@/lib/utils';

export interface KidCardProps {
  children: React.ReactNode;
  isInteractive?: boolean;
  className?: string;
}

export const KidCard = ({ children, isInteractive = false, className }: KidCardProps) => (
  <div
    className={cn(
      'rounded-3xl shadow-xl bg-white p-6',
      isInteractive &&
        'cursor-pointer active:scale-[0.98] transition-transform duration-150 hover:shadow-2xl',
      className,
    )}
  >
    {children}
  </div>
);
