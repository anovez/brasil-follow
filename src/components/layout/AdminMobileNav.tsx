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
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface AdminMobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Usuarios", href: "/admin/users", icon: Users },
  { label: "Pedidos", href: "/admin/orders", icon: Package },
  { label: "Servicos", href: "/admin/services", icon: ShoppingCart },
  { label: "Categorias", href: "/admin/categories", icon: FolderOpen },
  { label: "Provedores", href: "/admin/providers", icon: Plug },
  { label: "Pagamentos", href: "/admin/payments", icon: CreditCard },
  { label: "Estatisticas", href: "/admin/statistics", icon: BarChart3 },
  { label: "Suporte", href: "/admin/tickets", icon: MessageCircle },
  { label: "Afiliados", href: "/admin/affiliates", icon: UserCheck },
  { label: "Configuracoes", href: "/admin/settings", icon: Settings },
]

export function AdminMobileNav({ open, onOpenChange }: AdminMobileNavProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle>
            <span className="gradient-text text-xl font-bold">Admin</span>
          </SheetTitle>
        </SheetHeader>

        <Separator />

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
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-accent-primary/15 text-accent-primary font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-glass-bg"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive && "text-accent-primary"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <Separator />

        <div className="p-4 space-y-2">
          <Link
            href="/new-order"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-glass-bg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            <span>Painel do Cliente</span>
          </Link>
          <button
            onClick={() => {
              onOpenChange(false)
              signOut({ callbackUrl: "/login" })
            }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
