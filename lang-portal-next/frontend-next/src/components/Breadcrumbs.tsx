'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useNavigation } from '@/context/NavigationContext'

interface BreadcrumbItem {
  label: string
  href: string
}

// Define route mappings for breadcrumbs
const routeMappings: { [key: string]: string } = {
  '': 'Dashboard',
  'dashboard': 'Dashboard',
  'study-activities': 'Study Activities',
  'words': 'Words',
  'groups': 'Word Groups',
  'sessions': 'Study Sessions',
  'settings': 'Settings',
  'launch': 'Launch'
}

/**
 * Renders the breadcrumb navigation header.
 *
 * Constructs a breadcrumb trail based on the current URL path by splitting it into segments, mapping each segment to a
 * human-readable label, and dynamically substituting the label for the last breadcrumb with the active group, word,
 * or study activity from the navigation context when available.
 *
 * The header includes a sidebar trigger, a vertical separator, and a list of breadcrumb items where the final item
 * is rendered as a non-clickable page indicator.
 *
 * @returns The JSX element representing the breadcrumb navigation header.
 */
export default function Breadcrumbs() {
  const pathname = usePathname()
  const location = useLocation()
  const { currentGroup, currentWord, currentStudyActivity } = useNavigation()
  const paths = pathname.split('/').filter(Boolean)
  
  const breadcrumbs: BreadcrumbItem[] = paths.map((path, index) => {
    const href = `/${paths.slice(0, index + 1).join('/')}`
    let label = routeMappings[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')
    
    // Use group, word, or activity name for the last item if available
    if (index === paths.length - 1 || (path !== 'launch' && index === paths.length - 2)) {
      if (currentGroup && path === currentGroup.id.toString()) {
        label = currentGroup.group_name
      } else if (currentWord && path === currentWord.id.toString()) {
        label = currentWord.kanji
      } else if (currentStudyActivity && path === currentStudyActivity.id.toString()) {
        label = currentStudyActivity.title
      }
    }

    return { label, href }
  })

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <BreadcrumbItem key={item.href}>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}