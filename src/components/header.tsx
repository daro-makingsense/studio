"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"
import { usePathname } from "next/navigation"

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Weekly Agenda"
  const title = pathname.split("/").pop()?.replace("-", " ") || ""
  return title.charAt(0).toUpperCase() + title.slice(1)
}

export function Header() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center justify-end gap-4">
        {/* The header is intentionally sparse to maximize content visibility.
            Additional controls or breadcrumbs can be added here if needed. */}
      </div>
    </header>
  )
}
