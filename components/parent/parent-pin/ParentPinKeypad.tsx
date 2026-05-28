'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { PIN_LENGTH, PIN_SHAKE_DURATION_MS } from '@/lib/constants'

export type ParentPinKeypadSize = 'sm' | 'md' | 'lg'

export interface ParentPinKeypadProps {
  size?: ParentPinKeypadSize
  pinLength?: number
  onComplete: (pin: string) => void
  errorCount?: number
  isDisabled?: boolean
}

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del'] as const

const sizeConfig = {
  sm: { dot: 14, key: 56, keyText: 'text-[22px]', border: 3, gap: 8, stackGap: 18 },
  md: { dot: 20, key: 72, keyText: 'text-[26px]', border: 4, gap: 12, stackGap: 24 },
  lg: { dot: 24, key: 88, keyText: 'text-[32px]', border: 4, gap: 16, stackGap: 32 },
} as const

function PinDots({
  length,
  filled,
  dotSize,
  shake,
}: {
  length: number
  filled: number
  dotSize: number
  shake: boolean
}) {
  return (
    <div className={cn('flex gap-4', shake && 'animate-shake')}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-colors duration-150"
          style={{
            width: dotSize,
            height: dotSize,
            borderWidth: 4,
            borderStyle: 'solid',
            borderColor: i < filled ? '#3b82f6' : '#94a3b8',
            background: i < filled ? '#3b82f6' : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

function PinKey({
  children,
  variant = 'primary',
  size,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'secondary'
  size: ParentPinKeypadSize
  onClick?: () => void
  disabled?: boolean
}) {
  const cfg = sizeConfig[size]
  const styles =
    variant === 'primary'
      ? 'bg-blue-500 text-white border-blue-800'
      : variant === 'ghost'
        ? 'bg-transparent text-slate-300 border-slate-600'
        : 'bg-slate-700 text-white border-slate-800'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'grid place-items-center rounded-full font-extrabold transition-opacity',
        styles,
        cfg.keyText,
        disabled && 'cursor-not-allowed opacity-40'
      )}
      style={{
        width: cfg.key,
        height: cfg.key,
        borderWidth: cfg.border,
        borderStyle: 'solid',
      }}
    >
      {children}
    </button>
  )
}

export function ParentPinKeypad({
  size = 'md',
  pinLength = PIN_LENGTH,
  onComplete,
  errorCount = 0,
  isDisabled = false,
}: ParentPinKeypadProps) {
  const [value, setValue] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const prevErrorCount = useRef(0)
  const cfg = sizeConfig[size]

  useEffect(() => {
    if (errorCount === 0 || errorCount === prevErrorCount.current) return
    prevErrorCount.current = errorCount
    setValue('')
    setIsShaking(true)
    const t = setTimeout(() => setIsShaking(false), PIN_SHAKE_DURATION_MS)
    return () => clearTimeout(t)
  }, [errorCount])

  const handleKey = (key: string) => {
    if (isDisabled) return
    if (key === 'del') {
      setValue((v) => v.slice(0, -1))
      return
    }
    if (value.length >= pinLength) return
    const next = value + key
    setValue(next)
    if (next.length === pinLength) {
      onComplete(next)
    }
  }

  return (
    <div className="flex flex-col items-center" style={{ gap: cfg.stackGap }}>
      <PinDots length={pinLength} filled={value.length} dotSize={cfg.dot} shake={isShaking} />
      <div
        className="grid grid-cols-3"
        style={{ gap: cfg.gap, gridTemplateColumns: 'repeat(3, max-content)' }}
      >
        {KEYPAD_KEYS.map((k, i) => {
          if (k === null) return <div key={`blank-${i}`} />
          if (k === 'del') {
            return (
              <PinKey
                key="del"
                variant="ghost"
                size={size}
                disabled={isDisabled || value.length === 0}
                onClick={() => handleKey('del')}
              >
                ⌫
              </PinKey>
            )
          }
          return (
            <PinKey
              key={k}
              size={size}
              disabled={isDisabled}
              onClick={() => handleKey(k)}
            >
              {k}
            </PinKey>
          )
        })}
      </div>
    </div>
  )
}
