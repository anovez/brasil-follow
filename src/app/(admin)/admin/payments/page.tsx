"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectOption } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  DollarSign,
  Clock,
  TrendingUp,
  CreditCard,
} from "lucide-react"

interface PaymentData {
  id: number
  user: { id: number; name: string; email: string; username: string }
  amount: number
  method: string
  status: string
  efiTxId: string | null
  efiE2eId: string | null
  paidAt: string | null
  createdAt: string
}

interface PaymentStats {
  depositedToday: number
  depositedWeek: number
  depositedMonth: number
  pendingCount: number
  conversionRate: number
}

interface ServiceProfit {
  serviceId: number
  serviceName: string
  ordersCount: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

interface ProviderProfit {
  providerId: number
  providerName: string
  ordersCount: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  PAID: "Pago",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
}

const paymentStatusVariants: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  PAID: "success",
  EXPIRED: "danger",
  CANCELLED: "danger",
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState("deposits")
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [serviceAnalysis, setServiceAnalysis] = useState<ServiceProfit[]>([])
  const [providerAnalysis, setProviderAnalysis] = useState<ProviderProfit[]>([])
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "20",
      })
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/admin/payments?${params}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setPayments(data.payments)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setStats(data.stats)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFrom, dateTo, page])

  useEffect(() => {
    const timer = setTimeout(() => fetchPayments(), 300)
    return () => clearTimeout(timer)
  }, [fetchPayments])

  async function loadAnalysis(type: string) {
    setAnalysisLoading(true)
    try {
      const res = await fetch(`/api/admin/payments?analysis=${type}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      if (type === "services") setServiceAnalysis(data.analysis)
      if (type === "providers") setProviderAnalysis(data.analysis)
    } catch {
      // ignore
    } finally {
      setAnalysisLoading(false)
    }
  }

  function handleTabChange(newTab: string) {
    setTab(newTab)
    if (newTab === "services" && serviceAnalysis.length === 0) loadAnalysis("services")
    if (newTab === "providers" && providerAnalysis.length === 0) loadAnalysis("providers")
  }

  function handleExportCSV() {
    const params = new URLSearchParams({ format: "csv", status: statusFilter })
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    window.open(`/api/admin/payments?${params}`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Pagamentos</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent-success" />
                <p className="text-xs text-text-muted uppercase">Hoje</p>
              </div>
              <p className="text-lg font-bold text-text-primary mt-1">
                R$ {stats.depositedToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent-primary" />
                <p className="text-xs text-text-muted uppercase">Semana</p>
              </div>
              <p className="text-lg font-bold text-text-primary mt-1">
                R$ {stats.depositedWeek.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent-warning" />
                <p className="text-xs text-text-muted uppercase">Mes</p>
              </div>
              <p className="text-lg font-bold text-text-primary mt-1">
                R$ {stats.depositedMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-warning" />
                <p className="text-xs text-text-muted uppercase">Pendentes</p>
              </div>
              <p className="text-lg font-bold text-text-primary mt-1">{stats.pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-success" />
                <p className="text-xs text-text-muted uppercase">Conversao</p>
              </div>
              <p className="text-lg font-bold text-text-primary mt-1">{stats.conversionRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="deposits">Depositos</TabsTrigger>
          <TabsTrigger value="services">Lucro por Servico</TabsTrigger>
          <TabsTrigger value="providers">Lucro por Provedor</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          {/* Filters */}
          <Card className="glass-card mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-full md:w-40">
                  <SelectOption value="ALL">Todos Status</SelectOption>
                  <SelectOption value="PENDING">Pendente</SelectOption>
                  <SelectOption value="APPROVED">Aprovado</SelectOption>
                  <SelectOption value="PAID">Pago</SelectOption>
                  <SelectOption value="EXPIRED">Expirado</SelectOption>
                  <SelectOption value="CANCELLED">Cancelado</SelectOption>
                </Select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                  className="w-full md:w-40"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                  className="w-full md:w-40"
                />
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="ml-auto">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-text-muted">
                  Nenhum pagamento encontrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="hidden md:table-cell">TxID</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Criado em</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Pago em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs">#{payment.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-xs font-medium text-text-primary">{payment.user.name}</p>
                              <p className="text-[10px] text-text-muted">{payment.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            R$ {payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={paymentStatusVariants[payment.status] || "secondary"} className="text-[10px]">
                              {paymentStatusLabels[payment.status] || payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-text-muted font-mono max-w-[150px] truncate">
                            {payment.efiTxId || "-"}
                          </TableCell>
                          <TableCell className="text-right text-text-muted text-xs hidden sm:table-cell">
                            {new Date(payment.createdAt).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right text-text-muted text-xs hidden lg:table-cell">
                            {payment.paidAt ? new Date(payment.paidAt).toLocaleString("pt-BR") : "-"}
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
        </TabsContent>

        <TabsContent value="services">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Lucro por Servico</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {analysisLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : serviceAnalysis.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-text-muted">
                  Nenhum dado disponivel
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servico</TableHead>
                        <TableHead className="text-right">Pedidos</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Custo</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Margem %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceAnalysis.map((s) => (
                        <TableRow key={s.serviceId}>
                          <TableCell className="text-xs max-w-[250px] truncate">{s.serviceName}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{s.ordersCount}</TableCell>
                          <TableCell className="text-right font-mono text-xs">R$ {s.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-xs hidden sm:table-cell">R$ {s.cost.toFixed(2)}</TableCell>
                          <TableCell className={`text-right font-mono text-xs ${s.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                            R$ {s.profit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs hidden md:table-cell">
                            {s.margin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Lucro por Provedor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {analysisLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : providerAnalysis.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-text-muted">
                  Nenhum dado disponivel
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provedor</TableHead>
                        <TableHead className="text-right">Pedidos</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Custo</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Margem %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerAnalysis.map((p) => (
                        <TableRow key={p.providerId}>
                          <TableCell className="text-sm font-medium">{p.providerName}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{p.ordersCount}</TableCell>
                          <TableCell className="text-right font-mono text-xs">R$ {p.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-xs hidden sm:table-cell">R$ {p.cost.toFixed(2)}</TableCell>
                          <TableCell className={`text-right font-mono text-xs ${p.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                            R$ {p.profit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs hidden md:table-cell">
                            {p.margin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
