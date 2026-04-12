/** Root page — redirects to the dashboard. */

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
