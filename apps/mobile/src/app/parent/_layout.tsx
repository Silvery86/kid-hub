// Parent stack. Everything inside the PIN gate lives here.
import { Stack } from 'expo-router'

export default function ParentLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
