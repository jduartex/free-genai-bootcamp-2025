import * as React from "react"

const SidebarContext = React.createContext(null)

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}
