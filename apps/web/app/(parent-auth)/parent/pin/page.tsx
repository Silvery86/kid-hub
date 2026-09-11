/**
 * PIN gate.
 *
 * The gate state is resolved here rather than by the screen. It used to fire
 * checkParentSessionAction and checkParentPinAction from a mount effect, and a
 * Server Action is a POST to this URL — so every page load spent two tokens of
 * the middleware's 10-per-minute login budget before the parent touched the pad.
 * Five loads in a minute, which is a few trips between kid mode and parent mode,
 * and the gate locked itself out.
 *
 * Reading it on the server costs nothing, removes a round-trip from first paint,
 * and turns a client redirect flash into a real one.
 */

import { redirect } from 'next/navigation'

import { ParentPinScreen } from '@/components/parent/parent-pin/ParentPinScreen'
import { checkParentPinAction, checkParentSessionAction } from '@/server/actions/auth.actions'
import { pinScreenDestination } from '@/lib/parent-routing'

export const dynamic = 'force-dynamic'

export default async function ParentPinPage() {
  const [{ hasSession }, { hasPin }] = await Promise.all([
    checkParentSessionAction(),
    checkParentPinAction(),
  ])

  const destination = pinScreenDestination({ hasSession, hasPin })
  if (destination) redirect(destination)

  return <ParentPinScreen />
}
