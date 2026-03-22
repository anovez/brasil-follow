"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShoppingCart,
  Wallet,
  Users,
  BookOpen,
  Rocket,
  ClipboardList,
  CheckSquare,
  Plug,
  MessageCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

interface SidebarProps {
  user: {
    name?: string | null
    balance?: number
    level?: string
  }
}

const navItems = [
  {
    label: "Novo Pedido",
    href: "/new-order",
    icon: ShoppingCart,
    highlight: true,
  },
  {
    label: "Adicionar Saldo",
    href: "/add-funds",
    icon: Wallet,
  },
  {
    label: "Afiliados",
    href: "/affiliates",
    icon: Users,
  },
  {
    label: "Tutorial",
    href: "/tutorial",
    icon: BookOpen,
  },
  {
    label: "Seja Revendedor",
    href: "/be-reseller",
    icon: Rocket,
  },
  {
    label: "Nossos Servicos",
    href: "/services",
    icon: ClipboardList,
  },
  {
    label: "Pedidos Realizados",
    href: "/orders",
    icon: CheckSquare,
  },
  {
    label: "Nossa API",
    href: "/api-docs",
    icon: Plug,
  },
  {
    label: "Suporte",
    href: "/support",
    icon: MessageCircle,
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-bg-secondary/60 backdrop-blur-xl border-r border-glass-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16">
        {!collapsed && (
          <Link href="/new-order" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">Brasil Follow</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-bg transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200",
                  "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25",
                  "hover:shadow-accent-primary/40 hover:scale-[1.02]",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bg-accent-primary/15 text-accent-primary font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-glass-bg",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-accent-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User info */}
      <div className="p-4 space-y-3">
        {!collapsed && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary truncate">
              {user.name || "Usuario"}
            </p>
            <p className="text-xs text-accent-success font-semibold">
              {formatCurrency(user.balance ?? 0)}
            </p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
