"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingCart,
  Loader2,
  Wallet,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
  Crown,
  Star,
  Award,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useBalance } from "@/hooks/useBalance"
import { useOrders } from "@/hooks/useOrders"
import { formatCurrency, formatDate, calculateLevelDiscount } from "@/lib/utils"

function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplayed(0)
      return
    }
    const duration = 1200
    const steps = 40
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, value)
      setDisplayed(Math.round(current * 100) / 100)
      if (step >= steps) {
        setDisplayed(value)
        clearInterval(timer)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  if (prefix === "R$") {
    return <span>{formatCurrency(displayed)}</span>
  }
  return (
    <span>
      {prefix}
      {Math.round(displayed).toLocaleString("pt-BR")}
    </span>
  )
}

const statusColors: Record<string, string> = {
  PENDING: "warning",
  PROCESSING: "default",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  PARTIAL: "warning",
  CANCELLED: "danger",
  REFUNDED: "secondary",
  ERROR: "danger",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  PARTIAL: "Parcial",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  ERROR: "Erro",
}

const levelConfig: Record<string, { icon: React.ReactNode; color: string; next: string; threshold: number; nextThreshold: number }> = {
  BRONZE: {
    icon: <Star className="h-4 w-4" />,
    color: "text-amber-600",
    next: "PRATA",
    threshold: 0,
    nextThreshold: 100,
  },
  PRATA: {
    icon: <Award className="h-4 w-4" />,
    color: "text-gray-300",
    next: "OURO",
    threshold: 100,
    nextThreshold: 500,
  },
  OURO: {
    icon: <Crown className="h-4 w-4" />,
    color: "text-yellow-400",
    next: "DIAMANTE",
    threshold: 500,
    nextThreshold: 2000,
  },
  DIAMANTE: {
    icon: <Crown className="h-4 w-4" />,
    color: "text-cyan-300",
    next: "",
    threshold: 2000,
    nextThreshold: 2000,
  },
}

export default function DashboardPage() {
  const { balance, isLoading: balanceLoading } = useBalance()
  const { orders, total: totalOrders, isLoading: ordersLoading } = useOrders({ limit: 5 })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/balance")
      if (!res.ok) throw new Error("Failed to fetch stats")
      const json = await res.json()
      return json.data as { balance: number; level: string; totalSpent: number }
    },
    staleTime: 30000,
  })

  const level = statsData?.level || "BRONZE"
  const totalSpent = statsData?.totalSpent || 0
  const lc = levelConfig[level] || levelConfig.BRONZE
  const discount = calculateLevelDiscount(level)
  const progressToNext =
    level === "DIAMANTE"
      ? 100
      : Math.min(
          ((totalSpent - lc.threshold) / (lc.nextThreshold - lc.threshold)) * 100,
          100
        )

  const activeOrders = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PROCESSING" || o.status === "IN_PROGRESS"
  ).length

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Bem-vindo ao Painel
        </h1>
        <p className="text-text-secondary mt-1">
          Gerencie seus pedidos, saldo e muito mais.
        </p>
      </div>

      {/* Social proof ticker */}
      <div className="overflow-hidden rounded-lg border border-glass-border bg-glass-bg backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse-slow">
          <Zap className="h-4 w-4 text-accent-warning flex-shrink-0" />
          <p className="text-sm text-text-secondary">
            <span className="text-accent-warning font-semibold">1.247</span>{" "}
            pedidos realizados nas ultimas 24h
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total de Pedidos</p>
                {ordersLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    <AnimatedCounter value={totalOrders} />
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pedidos Ativos</p>
                {ordersLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    <AnimatedCounter value={activeOrders} />
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent-secondary/20 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-accent-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Saldo Atual</p>
                {balanceLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-accent-success mt-1">
                    <AnimatedCounter value={balance} prefix="R$" />
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent-success/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-accent-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Gasto</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    <AnimatedCounter value={totalSpent} prefix="R$" />
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent-warning/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Level Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/new-order">
                <Button size="lg">
                  <Plus className="h-4 w-4" />
                  Novo Pedido
                </Button>
              </Link>
              <Link href="/add-funds">
                <Button variant="secondary" size="lg">
                  <Wallet className="h-4 w-4" />
                  Adicionar Saldo
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" size="lg">
                  <ShoppingCart className="h-4 w-4" />
                  Meus Pedidos
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="lg">
                  <ArrowRight className="h-4 w-4" />
                  Ver Servicos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Level Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={lc.color}>{lc.icon}</span>
              Nivel {level}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {discount > 0 && (
              <p className="text-sm text-accent-success mb-2">
                Desconto de {discount}% em todos os pedidos
              </p>
            )}
            {level !== "DIAMANTE" ? (
              <>
                <p className="text-xs text-text-secondary mb-2">
                  Progresso para {lc.next}: {formatCurrency(totalSpent)} /{" "}
                  {formatCurrency(lc.nextThreshold)}
                </p>
                <Progress value={progressToNext} />
                <p className="text-xs text-text-muted mt-1">
                  Faltam {formatCurrency(Math.max(0, lc.nextThreshold - totalSpent))}
                </p>
              </>
            ) : (
              <p className="text-sm text-cyan-300">
                Voce atingiu o nivel maximo! Aproveite 10% de desconto.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos Recentes</CardTitle>
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Nenhum pedido encontrado</p>
              <Link href="/new-order">
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4" />
                  Fazer Primeiro Pedido
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead className="hidden md:table-cell">Servico</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {order.serviceName}
                    </TableCell>
                    <TableCell>{order.quantity.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{formatCurrency(order.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (statusColors[order.status] as "default" | "secondary" | "success" | "warning" | "danger" | "outline") ||
                          "secondary"
                        }
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-text-secondary text-xs">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
