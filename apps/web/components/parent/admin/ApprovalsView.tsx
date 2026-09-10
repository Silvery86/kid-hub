'use client'

import { FEEDBACK } from '@kid-hub/shared'

import { useCallback, useState, useTransition } from 'react'
import Link from 'next/link'

import {
  approveAccountAction,
  listAccountsAction,
  rejectAccountAction,
  suspendAccountAction,
  type AccountRow,
  type AccountStatus,
} from '@/server/actions/admin.actions'
import { toast } from '@/hooks/useToast'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

const TABS: { status: AccountStatus; label: string }[] = [
  { status: 'PENDING', label: 'Chờ duyệt' },
  { status: 'ACTIVE', label: 'Đang hoạt động' },
  { status: 'REJECTED', label: 'Đã từ chối' },
  { status: 'SUSPENDED', label: 'Đã vô hiệu hóa' },
]

export function ApprovalsView({ initialRows }: { initialRows: AccountRow[] }) {
  const [status, setStatus] = useState<AccountStatus>('PENDING')
  const [rows, setRows] = useState<AccountRow[]>(initialRows)
  // Distinct from "no rows": a failed load must not render as an empty list.
  const [loadFailed, setLoadFailed] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const load = useCallback(async (next: AccountStatus) => {
    setStatus(next)
    setLoadFailed(false)
    const result = await listAccountsAction(next)
    if (!result.success) {
      toast.error(result.error ?? FEEDBACK.approvals.loadFailed)
      setRows([])
      setLoadFailed(true)
      return
    }
    setRows(result.data)
  }, [])

  const review = useCallback(
    async (parentId: string, kind: 'approve' | 'reject' | 'suspend') => {
      setBusyId(parentId)
      const subject = rows.find((r) => r.id === parentId)
      const who = subject?.displayName ?? subject?.email ?? ''

      const note =
        kind === 'approve'
          ? undefined
          : (globalThis.prompt(
              kind === 'reject' ? 'Lý do từ chối (không bắt buộc)' : 'Lý do vô hiệu hóa (không bắt buộc)'
            ) ?? undefined)

      const action =
        kind === 'approve'
          ? approveAccountAction
          : kind === 'reject'
            ? rejectAccountAction
            : suspendAccountAction

      const result = await action({ parentId, note })
      setBusyId(null)

      if (!result.success) {
        toast.error(result.error ?? FEEDBACK.approvals.failed)
        return
      }
      // Approving is the one moment an applicant's account changes state and no
      // email goes out (see CLAUDE.md, Known gaps) — the admin's own record that
      // it happened is this toast and nothing else.
      if (kind === 'approve') toast.success(FEEDBACK.approvals.approved(who))
      else if (kind === 'reject') toast.success(FEEDBACK.approvals.rejected(who))
      else toast.success(FEEDBACK.approvals.suspended(who))

      // The row has left this list — drop it rather than re-fetching everything.
      startTransition(() => setRows((current) => current.filter((r) => r.id !== parentId)))
    },
    [rows]
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-black tracking-tight text-slate-800 md:text-[30px]">
            🛡️ Duyệt tài khoản
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Đăng ký mở, nhưng tài khoản chỉ dùng được sau khi bạn duyệt.
          </p>
        </div>
        <Link
          href="/parent"
          className="rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-slate-500 shadow-sm transition-colors hover:bg-slate-100"
        >
          ← Parent Mode
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            onClick={() => void load(tab.status)}
            aria-pressed={status === tab.status}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-extrabold transition-colors',
              status === tab.status
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-500 shadow-sm hover:bg-slate-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm font-bold text-slate-400 shadow-sm">
          {loadFailed
            ? 'Không tải được danh sách. Thử chọn lại tab.'
            : status === 'PENDING'
              ? 'Không có đăng ký nào đang chờ.'
              : 'Danh sách trống.'}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-black text-slate-800">{row.email}</p>
                <p className="m-0 text-xs font-bold text-slate-400">
                  {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {status === 'PENDING' ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void review(row.id, 'approve')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                      {busyId === row.id ? <Spinner size={12} /> : null} Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void review(row.id, 'reject')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 disabled:opacity-50"
                    >
                      {busyId === row.id ? <Spinner size={12} /> : null} Từ chối
                    </button>
                  </>
                ) : null}
                {status === 'ACTIVE' ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void review(row.id, 'suspend')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-xs font-black text-amber-700 disabled:opacity-50"
                  >
                    {busyId === row.id ? <Spinner size={12} /> : null} Vô hiệu hóa
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
