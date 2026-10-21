import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import { ThemeSync } from '@/components/theme-sync'
import { AppShell } from '@/components/app-shell'
import { defaultThemeStyle, themeBootScript } from '@/lib/theme-dom'
import { fontVariables } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'pengutype',
  description: 'a minimal, customizable typing test to measure your speed and accuracy. multiple languages, themes, and modes.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // the boot script rewrites the theme and font variables before hydration; font variables live on <html>
    // so --font-app (also set on <html>) can reference them
    <html lang="en" className={fontVariables} style={defaultThemeStyle} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          <ThemeSync />
          <AppShell>{children}</AppShell>
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
