import { redirect } from 'next/navigation'

import { ApprovalsView } from '@/components/parent/admin/ApprovalsView'
import { listAccountsAction } from '@/server/actions/admin.actions'

export const dynamic = 'force-dynamic'

/**
 * Admin only. The guard lives in the action, so an ordinary parent who reaches
 * this URL gets an error rather than a queue — but sending them away is kinder,
 * and keeps the page from rendering an empty shell they cannot use.
 */
export default async function ApprovalsPage() {
  const result = await listAccountsAction('PENDING')
  if (!result.success) redirect('/parent')

  return <ApprovalsView initialRows={result.data} />
}
