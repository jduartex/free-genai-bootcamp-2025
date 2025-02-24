import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { WholeWord, Group, Home, Hourglass, BookOpenText, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarProvider, // Import SidebarProvider
} from "@/components/ui/sidebar"

const navItems = [
  { icon: Home, name: 'Dashboard', path: '/dashboard' },
  { icon: BookOpenText, name: 'Study Activities', path: '/study-activities' },
  { icon: WholeWord, name: 'Words', path: '/words' },
  { icon: Group, name: 'Word Groups', path: '/groups' },
  { icon: Hourglass, name: 'Sessions', path: '/sessions' },
  { icon: Settings, name: 'Settings', path: '/settings' },
]

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  
  const isActive = (path: string) => {
    // Handle root path
    if (path === '/dashboard' && router.pathname === '/') return true
    // Handle nested routes by checking if the current path starts with the nav item path
    return router.pathname.startsWith(path)
  }
  
  return (
    <SidebarProvider> {/* Wrap with SidebarProvider */}
      <Sidebar {...props}>
        <SidebarHeader>
          LangPortal
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton isActive={isActive(item.path)}>
                      <Link href={item.path}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  )
}
