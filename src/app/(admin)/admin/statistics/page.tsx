"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Target,
  CreditCard,
} from "lucide-react"

interface StatsData {
  stats: {
    revenue: number
    cost: number
    profit: number
    margin: number
    newUsers: number
    totalOrders: number
    avgTicket: number
    avgDeposit: number
  }
  charts: {
    revenueChart: Array<{ date: string; revenue: number; cost: number; profit: number }>
    ordersPerDayChart: Array<{ date: string; orders: number }>
    ordersBySocialChart: Array<{ name: string; value: number; color: string }>
    topServicesByVolume: Array<{ name: string; count: number }>
    topServicesByProfit: Array<{ name: string; profit: number }>
    usersPerDayChart: Array<{ date: string; users: number }>
  }
  topClients: Array<{
    userId: number
    name: string
    email: string
    username: string
    ordersCount: number
    totalSpent: number
    profit: number
  }>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-glass-border bg-bg-secondary/95 backdrop-blur-xl p-3 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.name !== "Pedidos" && entry.name !== "Usuarios"
            ? `R$ ${entry.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function AdminStatisticsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ period })
      if (period === "custom" && customFrom) params.set("from", customFrom)
      if (period === "custom" && customTo) params.set("to", customTo)

      const res = await fetch(`/api/admin/statistics?${params}`)
      if (!res.ok) throw new Error("Erro")
      const result = await res.json()
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [period, customFrom, customTo])

  useEffect(() => {
    if (period !== "custom" || (customFrom && customTo)) {
      fetchStats()
    }
  }, [fetchStats])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Estatisticas</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-accent-danger">Erro ao carregar estatisticas</p>
      </div>
    )
  }

  const { stats, charts, topClients } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Estatisticas</h1>
      </div>

      {/* Period Filter */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { value: "today", label: "Hoje" },
              { value: "7d", label: "7 dias" },
              { value: "30d", label: "30 dias" },
              { value: "90d", label: "90 dias" },
              { value: "custom", label: "Personalizado" },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            {period === "custom" && (
              <>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-40"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent-primary" />
              <p className="text-xs text-text-muted uppercase">Receita</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">
              R$ {stats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent-warning" />
              <p className="text-xs text-text-muted uppercase">Custo</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">
              R$ {stats.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-success" />
              <p className="text-xs text-text-muted uppercase">Lucro</p>
            </div>
            <p className={`text-xl font-bold mt-1 ${stats.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
              R$ {stats.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent-primary" />
              <p className="text-xs text-text-muted uppercase">Margem</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">{stats.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-text-muted uppercase">Novos Usuarios</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">{stats.newUsers}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-yellow-400" />
              <p className="text-xs text-text-muted uppercase">Total Pedidos</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-text-muted uppercase">Ticket Medio</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">
              R$ {stats.avgTicket.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-text-muted uppercase">Deposito Medio</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">
              R$ {stats.avgDeposit.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Revenue & Orders per day */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Receita vs Custo vs Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.revenueChart}>
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
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-text-secondary">{value}</span>
                    )}
                  />
                  <Line type="monotone" dataKey="revenue" name="Receita" stroke="#6c5ce7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cost" name="Custo" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="profit" name="Lucro" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Pedidos por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.ordersPerDayChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                    stroke="#1e293b"
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#1e293b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" name="Pedidos" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Social & Users */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Pedidos por Rede Social</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.ordersBySocialChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {charts.ordersBySocialChart.map((entry, index) => (
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
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-text-secondary">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Novos Usuarios por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.usersPerDayChart}>
                  <defs>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                    stroke="#1e293b"
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#1e293b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Usuarios"
                    stroke="#3b82f6"
                    fill="url(#gradUsers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Top services */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Top 10 Servicos por Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topServicesByVolume} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#1e293b" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    stroke="#1e293b"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Pedidos" fill="#6c5ce7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Top 10 Servicos por Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topServicesByProfit} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    stroke="#1e293b"
                    tickFormatter={(v: number) => `R$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    stroke="#1e293b"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" name="Lucro" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Top Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topClients.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-text-muted">
              Nenhum cliente no periodo
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="text-right">Lucro Gerado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((client, i) => (
                    <TableRow key={client.userId}>
                      <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{client.name}</p>
                          <p className="text-[10px] text-text-muted">@{client.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{client.ordersCount}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        R$ {client.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs ${client.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                        R$ {client.profit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
