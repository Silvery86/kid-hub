/**
 * Shell-less layout for the parent screens a visitor reaches WITHOUT a session:
 * sign in, sign up, and the PIN pad.
 *
 * These sat in the (parent) group, which renders the management sidebar — so the
 * nav for a household appeared on the screen where you prove you belong to one.
 * The login screen hid it by painting a fixed overlay on top; the sidebar was
 * still in the DOM and still read out by a screen reader.
 */
export default function ParentAuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
