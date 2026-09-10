'use client'

/** Stagger — animates its children in sequence rather than all at once. */

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useStagger } from '@/hooks/animation'
import { STAGGER_BASE } from '@/lib/motion'
import type { MotionPreset } from './Motion'

const PRESET_CLASS: Record<MotionPreset, string> = {
  fadeIn: 'animate-in fade-in',
  fadeSlideUp: 'animate-fade-slide-up',
  popIn: 'animate-pop-in',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
}

export interface StaggerProps {
  children: ReactNode
  preset?: MotionPreset
  /** Milliseconds between siblings. Defaults to the `base` stagger token. */
  step?: number
  className?: string
}

interface Styleable {
  className?: string
  style?: React.CSSProperties
}

/**
 * The animation is merged onto each child rather than wrapped around it, so a
 * parent grid or flex row keeps its own children as direct descendants. Each
 * child must therefore accept `className` and `style`; a raw string or number
 * child is passed through untouched.
 */
export const Stagger = ({ children, preset = 'fadeSlideUp', step = STAGGER_BASE, className }: StaggerProps) => {
  const items = Children.toArray(children)
  const delays = useStagger(items.length, step)

  return (
    <>
      {items.map((child, index) => {
        if (!isValidElement(child)) return child
        const element = child as ReactElement<Styleable>
        const delay = delays[index] ?? 0
        return cloneElement(element, {
          key: element.key ?? index,
          className: cn(element.props.className, PRESET_CLASS[preset], className),
          style: {
            ...element.props.style,
            ...(delay ? { animationDelay: `${delay}ms` } : null),
          },
        })
      })}
    </>
  )
}
