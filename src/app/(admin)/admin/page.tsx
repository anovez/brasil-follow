"use client"

import { useState, useEffect, useRef } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Wallet,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react"

interface StatsData {
  revenue: { today: number; week: number; month: number }
  cost: { today: number; week: number; month: number }
  profit: { today: number; week: number; month: number }
  activeOrders: number
  newUsersToday: number
  totalProviderBalance: number
  providers: Array<{ id: number; name: string; balance: number; currency: string }>
  revenueChart: Array<{ date: string; revenue: number; profit: number }>
  orderStatusChart: Array<{ name: string; value: number; color: string }>
  recentOrders: Array<{
    id: number
    user: string
    service: string
    link: string
    quantity: number
    amount: number
    cost: number
    profit: number
    status: string
    createdAt: string
  }>
  alerts: Array<{ type: "danger" | "warning" | "info"; title: string; message: string }>
}

function AnimatedCounter({ target, prefix = "", suffix = "", decimals = 2 }: {
  target: number
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const startTime = useRef<number>(0)
  const animationFrame = useRef<number>(0)

  useEffect(() => {
    startTime.current = performance.now()
    const duration = 1200

    const animate = (now: number) => {
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      }
    }

    animationFrame.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame.current)
  }, [target])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

function StatCard({ title, value, icon: Icon, color, prefix = "R$ " }: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  prefix?: string
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
            <p className="text-xl font-bold text-text-primary">
              <AnimatedCounter target={value} prefix={prefix} />
            </p>
          </div>
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  PARTIAL: "Parcial",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
}

const statusVariants: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  PENDING: "warning",
  PROCESSING: "default",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  PARTIAL: "warning",
  CANCELLED: "danger",
  FAILED: "danger",
  REFUNDED: "secondary",
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-glass-border bg-bg-secondary/95 backdrop-blur-xl p-3 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: R$ {entry.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Erro ao carregar")
      const data = await res.json()
      setStats(data)
    } catch {
      setError("Erro ao carregar estatísticas")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-accent-danger">{error || "Erro desconhecido"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <button
          onClick={fetchStats}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md ${
                alert.type === "danger"
                  ? "border-accent-danger/30 bg-accent-danger/10"
                  : alert.type === "warning"
                  ? "border-accent-warning/30 bg-accent-warning/10"
                  : "border-accent-primary/30 bg-accent-primary/10"
              }`}
            >
              {alert.type === "danger" ? (
                <AlertCircle className="h-5 w-5 text-accent-danger shrink-0 mt-0.5" />
              ) : alert.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-accent-warning shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards - Revenue */}
      <div>
        <h2 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">Receita</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Receita Hoje" value={stats.revenue.today} icon={DollarSign} color="#6c5ce7" />
          <StatCard title="Receita Semana" value={stats.revenue.week} icon={DollarSign} color="#6c5ce7" />
          <StatCard title="Receita Mês" value={stats.revenue.month} icon={DollarSign} color="#6c5ce7" />
          <StatCard title="Lucro Hoje" value={stats.profit.today} icon={TrendingUp} color="#10b981" />
          <StatCard title="Lucro Semana" value={stats.profit.week} icon={TrendingUp} color="#10b981" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Lucro Mês" value={stats.profit.month} icon={TrendingUp} color="#10b981" />
        <StatCard title="Pedidos Ativos" value={stats.activeOrders} icon={ShoppingCart} color="#f59e0b" prefix="" />
        <StatCard title="Novos Usuários Hoje" value={stats.newUsersToday} icon={Users} color="#3b82f6" prefix="" />
        <StatCard title="Saldo Provedores" value={stats.totalProviderBalance} icon={Wallet} color="#8b5cf6" />
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Provedores</p>
            <div className="space-y-1">
              {stats.providers.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary truncate">{p.name}</span>
                  <span className={`font-mono ${Number(p.balance) < 50 ? "text-accent-danger" : "text-text-primary"}`}>
                    R$ {Number(p.balance).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue vs Profit Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Receita vs Lucro (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueChart}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                    stroke="#1e293b"
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    stroke="#1e293b"
                    tickFormatter={(v: number) => `R$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Receita"
                    stroke="#6c5ce7"
                    fill="url(#gradRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Lucro"
                    stroke="#10b981"
                    fill="url(#gradProfit)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.orderStatusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {stats.orderStatusChart.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    formatter={(value: unknown, name: unknown) => [String(value), statusLabels[String(name)] || String(name)]}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-text-secondary">
                        {statusLabels[value] || value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Últimos 10 Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-2 text-text-muted font-medium">ID</th>
                  <th className="text-left py-3 px-2 text-text-muted font-medium">Usuário</th>
                  <th className="text-left py-3 px-2 text-text-muted font-medium hidden md:table-cell">Serviço</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium">Valor</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium hidden sm:table-cell">Lucro</th>
                  <th className="text-center py-3 px-2 text-text-muted font-medium">Status</th>
                  <th className="text-right py-3 px-2 text-text-muted font-medium hidden lg:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-glass-border/50 hover:bg-glass-bg/50 transition-colors">
                    <td className="py-2.5 px-2 text-text-primary font-mono text-xs">#{order.id}</td>
                    <td className="py-2.5 px-2 text-text-primary text-xs">{order.user}</td>
                    <td className="py-2.5 px-2 text-text-secondary text-xs hidden md:table-cell max-w-[200px] truncate">
                      {order.service}
                    </td>
                    <td className="py-2.5 px-2 text-right text-text-primary font-mono text-xs">
                      R$ {order.amount.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono text-xs hidden sm:table-cell ${order.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                      R$ {order.profit.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <Badge variant={statusVariants[order.status] || "secondary"} className="text-[10px]">
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2 text-right text-text-muted text-xs hidden lg:table-cell">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
