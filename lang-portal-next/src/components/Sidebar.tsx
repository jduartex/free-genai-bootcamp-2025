import * as React from "react"
import { useSidebar } from "@/components/ui/sidebar" // Import useSidebar

const AppSidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar() // Use useSidebar hook

  return (
    <div>
      {/* Sidebar content */}
    </div>
  )
}

export default AppSidebar
