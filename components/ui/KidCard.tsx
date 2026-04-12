import { cn } from '@/lib/utils'

export interface KidCardProps {
  children: React.ReactNode
  isInteractive?: boolean
  className?: string
}

export const KidCard = ({ children, isInteractive = false, className }: KidCardProps) => (
  <div
    className={cn(
      'rounded-3xl bg-white p-6 shadow-xl',
      isInteractive &&
        'cursor-pointer transition-transform duration-150 hover:shadow-2xl active:scale-[0.98]',
      className
    )}
  >
    {children}
  </div>
)
