import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Reelto Drop — Live Saree Auctions',
  description: 'Live saree drops. Bid, win, wear.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://drop.reelto.in'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#fdf8f3',
          color: '#1a1a1a',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {children}
      </body>
    </html>
  )
}
