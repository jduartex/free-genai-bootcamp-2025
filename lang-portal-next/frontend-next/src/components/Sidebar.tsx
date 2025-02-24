'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  SidebarProvider,
} from "@/components/ui/sidebar"

const navItems = [
  { icon: Home, name: 'Dashboard', path: '/' },
  { icon: Group, name: 'Word Groups', path: '/groups' },
  { icon: BookOpenText, name: 'Study Activities', path: '/study-activities' },
  { icon: Hourglass, name: 'Study History', path: '/history' },
  { icon: Settings, name: 'Settings', path: '/settings' },
]

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar {...props}>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4">
            <WholeWord className="h-6 w-6" />
            <span className="font-semibold">Lang Portal</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} passHref>
                <SidebarMenuItem data-active={pathname === item.path}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </SidebarMenuItem>
              </Link>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  )
}
