'use client'

/** Motion — generic entrance wrapper. Replaces hand-written animate-in call sites. */

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/animation'

export type MotionPreset =
  | 'fadeIn'
  | 'fadeSlideUp'
  | 'popIn'
  | 'slideInLeft'
  | 'slideInRight'

const PRESET_CLASS: Record<MotionPreset, string> = {
  fadeIn: 'animate-in fade-in',
  fadeSlideUp: 'animate-fade-slide-up',
  popIn: 'animate-pop-in',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
}

export interface MotionProps {
  children: ReactNode
  preset?: MotionPreset
  /** Milliseconds. Usually comes from useStagger. */
  delay?: number
  className?: string
  /**
   * Merge the animation onto the single child element instead of wrapping it.
   * Use inside a grid or flex row, where an extra wrapper would break layout.
   * The child must accept `className` and `style`.
   */
  asChild?: boolean
}

interface Styleable {
  className?: string
  style?: React.CSSProperties
}

export const Motion = ({
  children,
  preset = 'fadeSlideUp',
  delay = 0,
  className,
  asChild = false,
}: MotionProps) => {
  const reduced = useReducedMotion()

  // At rest there is nothing to animate and no delay to honour — the content
  // must simply be present, which is also what a screenshot or a crawler sees.
  const motionClass = reduced ? undefined : PRESET_CLASS[preset]
  const style = reduced || !delay ? undefined : { animationDelay: `${delay}ms` }

  if (asChild) {
    const only = Children.only(children)
    if (!isValidElement(only)) return <>{children}</>
    const child = only as ReactElement<Styleable>
    return cloneElement(child, {
      className: cn(child.props.className, motionClass, className),
      style: { ...child.props.style, ...style },
    })
  }

  return (
    <div className={cn(motionClass, className)} style={style}>
      {children}
    </div>
  )
}
