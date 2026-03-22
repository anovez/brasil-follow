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
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name?: string | null
    balance?: number
    level?: string
  }
}

const navItems = [
  { label: "Novo Pedido", href: "/new-order", icon: ShoppingCart, highlight: true },
  { label: "Adicionar Saldo", href: "/add-funds", icon: Wallet },
  { label: "Afiliados", href: "/affiliates", icon: Users },
  { label: "Tutorial", href: "/tutorial", icon: BookOpen },
  { label: "Seja Revendedor", href: "/be-reseller", icon: Rocket },
  { label: "Nossos Servicos", href: "/services", icon: ClipboardList },
  { label: "Pedidos Realizados", href: "/orders", icon: CheckSquare },
  { label: "Nossa API", href: "/api-docs", icon: Plug },
  { label: "Suporte", href: "/support", icon: MessageCircle },
]

export function MobileNav({ open, onOpenChange, user }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle>
            <span className="gradient-text text-xl font-bold">Brasil Follow</span>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary truncate">
              {user.name || "Usuario"}
            </p>
            <p className="text-xs text-accent-success font-semibold">
              {formatCurrency(user.balance ?? 0)}
            </p>
          </div>
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40 transition-all duration-200"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            }

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

        <div className="p-4">
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
