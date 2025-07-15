import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import SuggestionsFloatingButton from './components/SuggestionsFloatingButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Family Chore Calendar',
  description: 'A comprehensive family chore management system with smart bidding and automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <SuggestionsFloatingButton />
        </Providers>
      </body>
    </html>
  )
}
