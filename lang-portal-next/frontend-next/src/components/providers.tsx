'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { NavigationProvider } from '@/context/NavigationContext'
import MainLayout from '@/layouts/mainlayout'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <NavigationProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </NavigationProvider>
    </ThemeProvider>
  )
}
