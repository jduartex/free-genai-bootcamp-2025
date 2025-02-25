'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { NavigationProvider } from '@/context/NavigationContext'
import MainLayout from '@/layouts/mainlayout'

/**
 * Wraps child components with theme, navigation, and layout contexts.
 *
 * This component nests its children within a ThemeProvider (configured with a default theme of "system"
 * and storage key "app-theme"), a NavigationProvider for navigation state, and a MainLayout for a consistent
 * application layout.
 *
 * @param children - The React nodes to be rendered within the providers and layout.
 *
 * @returns A JSX element that encapsulates the children with the necessary context providers and layout.
 */
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
