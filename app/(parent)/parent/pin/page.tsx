import { redirect } from 'next/navigation'

export default function LegacyParentPinPage() {
  redirect('/parent/login')
}
