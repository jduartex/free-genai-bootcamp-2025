'use client'

import * as React from "react"
import AppSidebar from "@/components/sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * Main layout component that displays a sidebar and main content area.
 *
 * This component renders an {@link AppSidebar} alongside a `main` element styled with flexbox. The main section,
 * which includes padding, is used to display the provided children.
 *
 * @param children - The content to render within the main area.
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div style={{ display: 'flex' }}>
      <AppSidebar />
      <main style={{ flex: 1, padding: '20px' }}>
        {children}
      </main>
    </div>
  )
}
