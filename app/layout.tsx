/** Root layout — applies global font, PWA metadata, viewport, and service worker. */

import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kid Hub',
  description: 'Your school hub — schedule, grades & learning games!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kid Hub',
  },
  // Android Chrome PWA splash screen colour
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1, // Prevent accidental pinch-zoom during games
  themeColor: '#3B82F6', // Matches manifest theme_color — blue-500
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
