'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { revokeDeviceAction, type DeviceRow } from '@/server/actions/invites.actions'

const formatWhen = (value: Date | string) =>
  new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

export function DevicesView({ devices }: { devices: DeviceRow[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const revoke = useCallback(
    async (tokenId: string) => {
      setBusyId(tokenId)
      setError('')
      const result = await revokeDeviceAction(tokenId)
      setBusyId(null)
      if (!result.success) {
        setError(result.error ?? 'Không đăng xuất được thiết bị')
        return
      }
      router.refresh()
    },
    [router]
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-black tracking-tight text-slate-800 md:text-[30px]">
            📱 Thiết bị
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Các thiết bị đang đăng nhập vào tài khoản này.
          </p>
        </div>
        <Link
          href="/parent"
          className="rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-slate-500 shadow-sm transition-colors hover:bg-slate-100"
        >
          ← Parent Mode
        </Link>
      </header>

      {error ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      ) : null}

      {devices.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm font-bold text-slate-400 shadow-sm">
          Không có thiết bị nào đang đăng nhập.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {devices.map((device) => (
            <li
              key={device.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-black text-slate-800">
                  {device.deviceLabel ?? 'Thiết bị không rõ'}
                </p>
                <p className="m-0 text-xs font-bold text-slate-400">
                  Dùng gần nhất {formatWhen(device.lastUsedAt)}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === device.id}
                onClick={() => void revoke(device.id)}
                className="shrink-0 rounded-xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 disabled:opacity-50"
              >
                Đăng xuất
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs font-bold text-slate-400">
        Đăng xuất một thiết bị không ảnh hưởng các thiết bị còn lại.
      </p>
    </div>
  )
}
