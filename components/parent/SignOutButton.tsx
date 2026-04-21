'use client'

/**
 * Sign-out button for the parent dashboard.
 * Calls the signOutParentAction and redirects to the PIN entry page.
 */

import { useRouter } from 'next/navigation'
import { signOutParentAction } from '@/server/actions/auth.actions'

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOutParentAction()
    router.push('/parent/pin')
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 font-bold text-red-600 shadow-sm transition-colors hover:bg-red-100"
    >
      🔓 Đăng xuất
    </button>
  )
}
