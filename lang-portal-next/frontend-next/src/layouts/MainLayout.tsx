import * as React from "react"
import { Outlet } from "react-router-dom"
import AppSidebar from "@/components/Sidebar"

export default function MainLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <AppSidebar />
      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  )
}
