"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FolderOpen,
  Plug,
  CreditCard,
  BarChart3,
  MessageCircle,
  UserCheck,
  Settings,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Usuarios",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Pedidos",
    href: "/admin/orders",
    icon: Package,
  },
  {
    label: "Servicos",
    href: "/admin/services",
    icon: ShoppingCart,
  },
  {
    label: "Categorias",
    href: "/admin/categories",
    icon: FolderOpen,
  },
  {
    label: "Provedores",
    href: "/admin/providers",
    icon: Plug,
  },
  {
    label: "Pagamentos",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Estatisticas",
    href: "/admin/statistics",
    icon: BarChart3,
  },
  {
    label: "Suporte",
    href: "/admin/tickets",
    icon: MessageCircle,
  },
  {
    label: "Afiliados",
    href: "/admin/affiliates",
    icon: UserCheck,
  },
  {
    label: "Configuracoes",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
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
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">Admin</span>
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
        {adminNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          const Icon = item.icon

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
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive && "text-accent-primary"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Footer actions */}
      <div className="p-4 space-y-2">
        <Link
          href="/new-order"
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-glass-bg transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Painel do Cliente" : undefined}
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Painel do Cliente</span>}
        </Link>
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
