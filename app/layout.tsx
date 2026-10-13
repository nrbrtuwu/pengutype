import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import { ThemeSync } from '@/components/theme-sync'
import { AppShell } from '@/components/app-shell'
import { defaultThemeStyle, themeBootScript } from '@/lib/theme-dom'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

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
    // the boot script rewrites the theme variables before hydration
    <html lang="en" style={defaultThemeStyle} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthSessionProvider>
          <ThemeSync />
          <AppShell>{children}</AppShell>
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
