"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  LayoutGrid,
  Calendar,
  ListTodo,
  Shield,
  Users,
  Clock,
  Briefcase,
  Megaphone,
  SquareKanban,
  LayoutDashboard,
} from "lucide-react"
import { UserNav } from "./user-nav"
import { cn } from "@/lib/utils"
import { UserContext } from "@/context/UserContext"

const navItems = [
  { href: "/canvas", label: "Agenda Semanal", icon: SquareKanban },
  { href: "/timeline", label: "Cronograma Diario", icon: Clock },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/tasks", label: "Tareas", icon: ListTodo, adminOnly: true },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
]

export function MainNav() {
  const pathname = usePathname()
  const { currentUser } = React.useContext(UserContext)
  const canAccessAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <SidebarTrigger className="ml-auto" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold font-headline group-data-[collapsible=icon]:hidden">
            Task Canvas
          </span>
          <LayoutDashboard className="h-6 w-6 text-primary group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {navItems.map((item) => {
          if (item.adminOnly && !canAccessAdmin) {
            return null
          }
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="w-full justify-start"
                tooltip={{
                  children: item.label,
                  className: "bg-background text-foreground",
                }}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
      <SidebarFooter className="p-2">
        <UserNav />
      </SidebarFooter>
    </>
  )
}
