import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import { DynamicFavicon } from '@/components/dynamic-favicon'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const faviconBootScript = `
(() => {
  try {
    const raw = window.localStorage.getItem('pengutype-storage');
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const theme = parsed?.state?.theme;
    const themeToPrimary = {
      aurora: '#c879ff',
      cyber: '#00ffcc',
      sunset: '#ff7b54',
      ocean: '#4fc3f7',
      forest: '#7dcea0',
      serika_dark: '#e2b714',
      dracula: '#bd93f9',
      monokai: '#f92672',
      nord: '#88c0d0',
      synthwave: '#ff7edb',
      tokyo_night: '#7aa2f7',
      catppuccin: '#cba6f7',
      midnight: '#00d9ff',
      rose_pine: '#eb6f92'
    };

    const color = themeToPrimary[theme] || themeToPrimary.aurora;
    const svg = '<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="180" height="180" rx="36" fill="' + color + '"/></svg>';
    const href = 'data:image/svg+xml,' + encodeURIComponent(svg) + '#' + (theme || 'aurora');

    const selectors = ['icon', 'shortcut icon', 'apple', 'apple-touch-icon'];
    for (const rel of selectors) {
      let link = document.head.querySelector('link[rel="' + rel + '"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.type = 'image/svg+xml';
      link.href = href;
    }
  } catch {}
})();
`;

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Script id="favicon-theme-bootstrap" strategy="beforeInteractive">
          {faviconBootScript}
        </Script>
        <AuthSessionProvider>
          <DynamicFavicon />
          {children}
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
