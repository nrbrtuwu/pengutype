import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import { DynamicFavicon } from '@/components/dynamic-favicon'
import { FAVICON_LINK_ID, faviconHrefs } from '@/lib/favicon'
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
  description: 'a sleek, customizable typing test to measure your speed and accuracy. multiple languages, themes, and modes.',
}

export const viewport: Viewport = {
  themeColor: '#1e1e2e',
  width: 'device-width',
  initialScale: 1,
}

// Set the themed favicon before hydration so the tab icon doesn't flash the default theme
const faviconBootScript = `(() => {
  try {
    const hrefs = ${JSON.stringify(faviconHrefs)};
    const theme = JSON.parse(localStorage.getItem('pengutype-storage'))?.state?.theme;
    if (hrefs[theme]) document.getElementById('${FAVICON_LINK_ID}').href = hrefs[theme];
  } catch {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link id={FAVICON_LINK_ID} rel="icon" type="image/svg+xml" href={faviconHrefs.aurora} />
        <script dangerouslySetInnerHTML={{ __html: faviconBootScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthSessionProvider>
          <DynamicFavicon />
          {children}
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
