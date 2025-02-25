import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { metadata } from './metadata'
import ApiStatusBanner from '@/components/ApiStatusBanner'

const inter = Inter({ subsets: ['latin'] })

/**
 * Serves as the root layout for the Next.js application.
 *
 * This component sets up the foundational HTML structure with a language attribute of "en" and suppressed hydration warnings. It applies the global Inter font style to the body and wraps its children with context providers, also appending an API status banner.
 *
 * @param children - The nested components to be rendered within the layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <Providers>
          {children}
          <ApiStatusBanner />
        </Providers>
      </body>
    </html>
  )
}
