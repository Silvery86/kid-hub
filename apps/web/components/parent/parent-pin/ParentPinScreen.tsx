'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  checkParentPinAction,
  checkParentSessionAction,
  verifyPinAction,
} from '@/server/actions/auth.actions'
import { ParentPinHero } from './ParentPinHero'
import { ParentPinKeypad, type ParentPinKeypadSize } from './ParentPinKeypad'

function usePinViewportSize(): ParentPinKeypadSize {
  const [size, setSize] = useState<ParentPinKeypadSize>('md')

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= 1024) setSize('lg')
      else if (w < 480) setSize('sm')
      else setSize('md')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return size
}

export function ParentPinScreen() {
  const router = useRouter()
  const size = usePinViewportSize()
  const [errorCount, setErrorCount] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subtitle, setSubtitle] = useState('Nhập mã PIN để tiếp tục')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    void (async () => {
      const [{ hasSession }, { hasPin }] = await Promise.all([
        checkParentSessionAction(),
        checkParentPinAction(),
      ])
      if (hasSession) {
        router.replace('/parent')
        return
      }
      if (!hasPin) {
        router.replace('/parent/login')
        return
      }
      setIsReady(true)
    })()
  }, [router])

  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return
    const timer = setInterval(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          setIsLocked(false)
          setSubtitle('Nhập mã PIN để tiếp tục')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isLocked, lockoutSeconds])

  const handleComplete = useCallback(
    async (pin: string) => {
      if (isLocked || isSubmitting) return
      setIsSubmitting(true)

      const result = await verifyPinAction(pin)
      setIsSubmitting(false)

      if (result.success) {
        router.replace('/parent')
        return
      }

      if (result.isLocked) {
        setIsLocked(true)
        setLockoutSeconds(result.lockoutSeconds ?? 60)
        setSubtitle(`Vui lòng thử lại sau ${result.lockoutSeconds ?? 60}s`)
        return
      }

      if (result.isWrong) {
        setSubtitle('Sai mã PIN. Thử lại.')
        setErrorCount((c) => c + 1)
      }
    },
    [isLocked, isSubmitting, router]
  )

  if (!isReady) {
    return (
      <div className="fixed inset-0 flex min-h-dvh items-center justify-center bg-shell-dark">
        <div className="text-5xl" aria-hidden="true">
          🔒
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center gap-6 bg-shell-dark px-4 py-5 md:gap-7 lg:gap-9">
      <ParentPinHero
        size={size}
        icon={isLocked ? '⛔' : '🔒'}
        title={isLocked ? 'Đã khóa tạm thời' : 'Parent Mode'}
        subtitle={subtitle}
      />

      {isLocked ? (
        <Link
          href="/parent/login"
          className="rounded-full border-[3px] border-slate-600 px-6 py-3 text-sm font-extrabold text-slate-300"
        >
          Đăng nhập lại
        </Link>
      ) : (
        <ParentPinKeypad
          size={size}
          onComplete={handleComplete}
          errorCount={errorCount}
          isDisabled={isSubmitting}
        />
      )}

      {!isLocked ? (
        <Link
          href="/parent/login"
          className="text-[13px] font-bold text-slate-600 hover:text-slate-400"
        >
          Quên mã PIN?
        </Link>
      ) : null}
    </div>
  )
}
