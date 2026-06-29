/** Root page — middleware routes to kid-unlock or dashboard based on session. */

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/kid-unlock')
}
