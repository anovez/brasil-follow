"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Wallet, Shield } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  user: {
    name?: string | null
    image?: string | null
    email?: string | null
    balance?: number
    level?: string
    role?: string
  }
  onMenuToggle?: () => void
}

function getLevelBadgeVariant(level: string) {
  switch (level) {
    case "DIAMANTE":
      return "default" as const
    case "OURO":
      return "warning" as const
    case "PRATA":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function getLevelLabel(level: string) {
  switch (level) {
    case "DIAMANTE":
      return "Diamante"
    case "OURO":
      return "Ouro"
    case "PRATA":
      return "Prata"
    default:
      return "Bronze"
  }
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 border-b border-glass-border bg-bg-secondary/60 backdrop-blur-xl">
      {/* Left: mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-bg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: balance, level, user */}
      <div className="flex items-center gap-4">
        {/* Balance */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass-bg border border-glass-border">
          <Wallet className="h-4 w-4 text-accent-success" />
          <span className="text-sm font-semibold text-accent-success">
            {formatCurrency(user.balance ?? 0)}
          </span>
        </div>

        {/* Level badge */}
        <Badge variant={getLevelBadgeVariant(user.level || "BRONZE")}>
          {getLevelLabel(user.level || "BRONZE")}
        </Badge>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-glass-bg transition-colors cursor-pointer">
              <Avatar
                src={user.image}
                alt={user.name || "Usuario"}
                fallback={user.name?.charAt(0) || "U"}
                size="sm"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name || "Usuario"}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Balance on mobile */}
            <div className="sm:hidden px-2 py-1.5">
              <p className="text-xs text-text-muted">Saldo</p>
              <p className="text-sm font-semibold text-accent-success">
                {formatCurrency(user.balance ?? 0)}
              </p>
            </div>
            <div className="sm:hidden">
              <DropdownMenuSeparator />
            </div>

            <DropdownMenuItem>
              <Link href="/profile" className="flex items-center gap-2 w-full">
                Meu Perfil
              </Link>
            </DropdownMenuItem>

            {user.role === "ADMIN" && (
              <DropdownMenuItem>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 w-full"
                >
                  <Shield className="h-4 w-4" />
                  Painel Admin
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-accent-danger hover:text-accent-danger"
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
