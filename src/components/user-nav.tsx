"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, User, Settings } from "lucide-react"
import { signOut, useSession, signIn } from "next-auth/react"

export function UserNav() {
  const { data: session, status } = useSession()

  if (!session) {
    return (
      <Button variant="ghost" onClick={() => signIn("google", { callbackUrl: "/" })}>
        Iniciar sesión
      </Button>
    )
  }

  const userName = session.user?.name ?? "Usuario"
  const userEmail = session.user?.email ?? ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-full justify-start gap-2 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user?.image ?? undefined} />
            <AvatarFallback>{userName?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
            <span className="font-medium">{userName}</span>
            {userEmail ? (
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            ) : null}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            {userEmail ? (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/admin">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfiles</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
