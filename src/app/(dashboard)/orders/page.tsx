"use client"

import { useState } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShoppingCart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOrders } from "@/hooks/useOrders"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusOptions = [
  { value: "", label: "Todos os Status" },
  { value: "PENDING", label: "Pendente" },
  { value: "PROCESSING", label: "Processando" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "COMPLETED", label: "Concluido" },
  { value: "PARTIAL", label: "Parcial" },
  { value: "CANCELLED", label: "Cancelado" },
]

const statusBadgeVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "outline"> = {
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
  COMPLETED: "Concluido",
  PARTIAL: "Parcial",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  ERROR: "Erro",
}

function truncateLink(link: string, max: number = 40): string {
  if (link.length <= max) return link
  return link.substring(0, max) + "..."
}

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchId, setSearchId] = useState("")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const { orders, totalPages, total, isLoading } = useOrders({
    page,
    limit: 20,
    status: statusFilter || undefined,
  })

  const filteredOrders = searchId
    ? orders.filter((o) => String(o.id).includes(searchId))
    : orders

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Meus Pedidos</h1>
        <p className="text-text-secondary mt-1">
          Acompanhe todos os seus pedidos realizados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedidos ({total})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Buscar por ID..."
                  className="pl-9 w-full sm:w-40"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full sm:w-48"
              >
                {statusOptions.map((opt) => (
                  <SelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="hidden md:table-cell">Servico</TableHead>
                    <TableHead className="hidden lg:table-cell">Link</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <>
                      <TableRow
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() =>
                          setExpandedRow(expandedRow === order.id ? null : order.id)
                        }
                      >
                        <TableCell>
                          {expandedRow === order.id ? (
                            <ChevronUp className="h-4 w-4 text-text-muted" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-text-muted" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm">
                          {order.serviceName}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-accent-primary hover:underline text-sm flex items-center gap-1"
                          >
                            {truncateLink(order.link)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>{order.quantity.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{formatCurrency(order.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[order.status] || "secondary"}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-text-secondary text-xs">
                          {formatDate(order.createdAt)}
                        </TableCell>
                      </TableRow>
                      {expandedRow === order.id && (
                        <TableRow key={`${order.id}-detail`}>
                          <TableCell colSpan={8}>
                            <div className="rounded-lg bg-glass-bg border border-glass-border p-4 space-y-2 text-sm">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-text-muted text-xs">Servico</p>
                                  <p className="text-text-primary">{order.serviceName}</p>
                                </div>
                                <div>
                                  <p className="text-text-muted text-xs">Link</p>
                                  <a
                                    href={order.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-primary hover:underline break-all"
                                  >
                                    {order.link}
                                  </a>
                                </div>
                                <div>
                                  <p className="text-text-muted text-xs">Data de Criacao</p>
                                  <p className="text-text-primary">{formatDate(order.createdAt)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-glass-border">
                                <div>
                                  <p className="text-text-muted text-xs">Start Count</p>
                                  <p className="text-text-primary">
                                    {order.startCount !== null ? order.startCount.toLocaleString("pt-BR") : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-text-muted text-xs">Restante</p>
                                  <p className="text-text-primary">
                                    {order.remains !== null ? order.remains.toLocaleString("pt-BR") : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-text-muted text-xs">ID do Provedor</p>
                                  <p className="text-text-primary font-mono">
                                    {order.providerOrderId || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-glass-border">
                  <p className="text-sm text-text-secondary">
                    Pagina {page} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                    >
                      Proximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
