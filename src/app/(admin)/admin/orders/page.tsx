"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectOption } from "@/components/ui/select"
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreHorizontal,
  RefreshCw,
  XCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Download,
  ShoppingCart,
  TrendingUp,
  ArrowDownCircle,
  CheckSquare,
} from "lucide-react"

interface OrderData {
  id: number
  externalId: string
  user: { id: number; name: string; email: string; username: string }
  service: { id: number; name: string }
  link: string
  quantity: number
  amount: number
  cost: number
  profit: number
  status: string
  providerOrderId: string | null
  startCount: number | null
  remains: number | null
  createdAt: string
  updatedAt: string
}

interface Totals {
  count: number
  revenue: number
  cost: number
  profit: number
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluido",
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState<Totals>({ count: 0, revenue: 0, cost: 0, profit: 0 })
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [syncing, setSyncing] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "20",
      })
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      if (userSearch) params.set("userSearch", userSearch)

      const res = await fetch(`/api/admin/orders?${params}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setOrders(data.orders)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setTotals(data.totals)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFrom, dateTo, userSearch, page])

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 300)
    return () => clearTimeout(timer)
  }, [fetchOrders])

  async function handleAction(action: string, orderId: number) {
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao executar acao")
        return
      }
      if (action === "cancel" || action === "refund") {
        alert(`Reembolso de R$ ${data.refundAmount?.toFixed(2)} realizado com sucesso`)
      }
      fetchOrders()
    } catch {
      alert("Erro ao executar acao")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBulkSync() {
    if (selected.size === 0) return
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-sync", orderIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao sincronizar")
        return
      }
      alert(`Sincronizados: ${data.results?.length || 0} pedidos`)
      setSelected(new Set())
      fetchOrders()
    } catch {
      alert("Erro ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  function handleExportCSV() {
    const params = new URLSearchParams({ format: "csv", status: statusFilter })
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    if (userSearch) params.set("userSearch", userSearch)
    window.open(`/api/admin/orders?${params}`, "_blank")
  }

  function toggleSelect(id: number) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (selected.size === orders.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(orders.map((o) => o.id)))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Pedidos</h1>
        <Badge variant="secondary" className="ml-auto">{total} total</Badge>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider">Total Pedidos</p>
            <p className="text-xl font-bold text-text-primary mt-1">{totals.count}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent-primary" />
              <p className="text-xs text-text-muted uppercase tracking-wider">Receita</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">
              R$ {totals.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-accent-warning" />
              <p className="text-xs text-text-muted uppercase tracking-wider">Custo</p>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1">
              R$ {totals.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-success" />
              <p className="text-xs text-text-muted uppercase tracking-wider">Lucro</p>
            </div>
            <p className={`text-xl font-bold mt-1 ${totals.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
              R$ {totals.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Buscar por usuario ou ID..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-full md:w-40">
              <SelectOption value="ALL">Todos Status</SelectOption>
              <SelectOption value="PENDING">Pendente</SelectOption>
              <SelectOption value="PROCESSING">Processando</SelectOption>
              <SelectOption value="IN_PROGRESS">Em Andamento</SelectOption>
              <SelectOption value="COMPLETED">Concluido</SelectOption>
              <SelectOption value="PARTIAL">Parcial</SelectOption>
              <SelectOption value="CANCELLED">Cancelado</SelectOption>
              <SelectOption value="FAILED">Falhou</SelectOption>
              <SelectOption value="REFUNDED">Reembolsado</SelectOption>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="w-full md:w-40"
              placeholder="De"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="w-full md:w-40"
              placeholder="Ate"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {selected.size > 0 && (
              <Button size="sm" onClick={handleBulkSync} loading={syncing}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync Selecionados ({selected.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="ml-auto">
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Nenhum pedido encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <button onClick={toggleSelectAll} className="text-text-muted hover:text-text-primary">
                        <CheckSquare className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden lg:table-cell">Servico</TableHead>
                    <TableHead className="hidden xl:table-cell">Link</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Custo</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Lucro</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className={selected.has(order.id) ? "bg-accent-primary/5" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded border-glass-border"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{order.user.name}</p>
                          <p className="text-[10px] text-text-muted">@{order.user.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-text-secondary max-w-[200px] truncate">
                        {order.service.name}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-text-muted max-w-[150px] truncate">
                        <a href={order.link} target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary transition-colors">
                          {order.link.length > 30 ? order.link.slice(0, 30) + "..." : order.link}
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{order.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-xs">R$ {order.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-xs hidden md:table-cell">R$ {order.cost.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-mono text-xs hidden md:table-cell ${order.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                        R$ {order.profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariants[order.status] || "secondary"} className="text-[10px]">
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-text-muted text-xs hidden lg:table-cell">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading === order.id}>
                              {actionLoading === order.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleAction("sync", order.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sincronizar Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction("cancel", order.id)}>
                              <XCircle className="h-4 w-4 mr-2 text-accent-danger" />
                              Cancelar + Reembolsar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("refund", order.id)}>
                              <DollarSign className="h-4 w-4 mr-2 text-accent-warning" />
                              Reembolsar Manualmente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-glass-border">
              <p className="text-sm text-text-muted">
                Pagina {page} de {totalPages} ({total} resultados)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
