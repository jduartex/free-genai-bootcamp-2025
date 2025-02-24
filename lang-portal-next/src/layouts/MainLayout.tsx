import * as React from "react"
import { Outlet } from "react-router-dom"
import AppSidebar from "@/components/Sidebar"
import { SidebarProvider } from "@/components/ui/sidebar" // Import SidebarProvider

export default function MainLayout() {
  return (
    <SidebarProvider> {/* Wrap with SidebarProvider */}
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  )
}
