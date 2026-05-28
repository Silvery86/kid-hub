/** Root page — middleware decides unlock vs dashboard, fallback goes to unlock. */

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/unlock')
}
