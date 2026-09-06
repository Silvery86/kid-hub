import { redirect } from 'next/navigation'

import { DevicesView } from '@/components/parent/devices/DevicesView'
import { listDevicesAction } from '@/server/actions/invites.actions'

export const dynamic = 'force-dynamic'

export default async function DevicesPage() {
  const result = await listDevicesAction()
  if (!result.success) redirect('/parent/login')

  return <DevicesView devices={result.data} />
}
