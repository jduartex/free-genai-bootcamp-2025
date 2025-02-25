import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
export { metadata } from './metadata'
import ApiStatusBanner from '@/components/ApiStatusBanner'

const inter = Inter({ subsets: ['latin'] })

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
