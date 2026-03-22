"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectOption } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  Send,
  XCircle,
} from "lucide-react"

interface TicketData {
  id: number
  user: { id: number; name: string; email: string; username: string }
  subject: string
  status: string
  isUrgent: boolean
  lastMessage: { text: string; isAdmin: boolean; createdAt: string } | null
  createdAt: string
  updatedAt: string
}

interface TicketStats {
  open: number
  waiting: number
  closedToday: number
}

interface TicketMessage {
  id: number
  message: string
  isAdmin: boolean
  user: { id: number; name: string; role: string; image: string | null }
  createdAt: string
}

interface TicketDetail {
  id: number
  subject: string
  status: string
  user: { id: number; name: string; email: string; username: string; image: string | null }
  messages: TicketMessage[]
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  OPEN: "Aberto",
  WAITING: "Aguardando",
  CLOSED: "Fechado",
}

const statusVariants: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  OPEN: "warning",
  WAITING: "default",
  CLOSED: "secondary",
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [ticketStats, setTicketStats] = useState<TicketStats>({ open: 0, waiting: 0, closedToday: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "20",
      })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/tickets?${params}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setTickets(data.tickets)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setTicketStats(data.stats)
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => {
    const timer = setTimeout(() => fetchTickets(), 300)
    return () => clearTimeout(timer)
  }, [fetchTickets])

  useEffect(() => {
    if (detail && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [detail?.messages.length])

  async function openTicketDetail(ticketId: number) {
    setDetailOpen(true)
    setDetailLoading(true)
    setReplyText("")
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setDetail(data.ticket)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleReply(closeTicket: boolean) {
    if (!detail || !replyText.trim()) return
    setReplyLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${detail.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText, closeTicket }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao responder")
        return
      }
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, data.message],
              status: data.newStatus,
            }
          : null
      )
      setReplyText("")
      fetchTickets()
    } catch {
      alert("Erro ao responder")
    } finally {
      setReplyLoading(false)
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return "Agora"
    if (hours < 24) return `${hours}h atras`
    const days = Math.floor(hours / 24)
    return `${days}d atras`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Tickets</h1>
        <Badge variant="secondary" className="ml-auto">{total} total</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent-warning" />
              <p className="text-xs text-text-muted uppercase">Abertos</p>
            </div>
            <p className="text-2xl font-bold text-text-primary mt-1">{ticketStats.open}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent-primary" />
              <p className="text-xs text-text-muted uppercase">Aguardando</p>
            </div>
            <p className="text-2xl font-bold text-text-primary mt-1">{ticketStats.waiting}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent-success" />
              <p className="text-xs text-text-muted uppercase">Fechados Hoje</p>
            </div>
            <p className="text-2xl font-bold text-text-primary mt-1">{ticketStats.closedToday}</p>
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
                placeholder="Buscar por assunto ou usuario..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-full md:w-40">
              <SelectOption value="ALL">Todos Status</SelectOption>
              <SelectOption value="OPEN">Aberto</SelectOption>
              <SelectOption value="WAITING">Aguardando</SelectOption>
              <SelectOption value="CLOSED">Fechado</SelectOption>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Nenhum ticket encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Ultima Msg</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-glass-bg/80 transition-colors"
                      onClick={() => openTicketDetail(ticket.id)}
                    >
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1">
                          #{ticket.id}
                          {ticket.isUrgent && (
                            <AlertTriangle className="h-3 w-3 text-accent-danger" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{ticket.user.name}</p>
                          <p className="text-[10px] text-text-muted">{ticket.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-text-primary max-w-[200px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={statusVariants[ticket.status] || "secondary"} className="text-[10px]">
                            {statusLabels[ticket.status] || ticket.status}
                          </Badge>
                          {ticket.isUrgent && (
                            <Badge variant="danger" className="text-[9px]">+24h</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-text-muted max-w-[200px] truncate">
                        {ticket.lastMessage ? (
                          <span>
                            {ticket.lastMessage.isAdmin ? "[Admin] " : ""}
                            {ticket.lastMessage.text}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-text-muted text-xs hidden sm:table-cell">
                        {timeAgo(ticket.updatedAt)}
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

      {/* Ticket Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {detail ? `#${detail.id} - ${detail.subject}` : "Carregando..."}
            </DialogTitle>
            {detail && (
              <DialogDescription>
                <span className="flex items-center gap-2">
                  <span>{detail.user.name} ({detail.user.email})</span>
                  <Badge variant={statusVariants[detail.status] || "secondary"} className="text-[10px]">
                    {statusLabels[detail.status] || detail.status}
                  </Badge>
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : detail ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0 max-h-[50vh]">
                {detail.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        msg.isAdmin
                          ? "bg-accent-primary/20 border border-accent-primary/30"
                          : "bg-glass-bg border border-glass-border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${msg.isAdmin ? "text-accent-primary" : "text-text-primary"}`}>
                          {msg.isAdmin ? "Admin" : msg.user.name}
                        </span>
                        <span className="text-[10px] text-text-muted">{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply */}
              {detail.status !== "CLOSED" && (
                <div className="border-t border-glass-border pt-4 space-y-3">
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReply(false)}
                      loading={replyLoading}
                      disabled={!replyText.trim()}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Responder e Manter Aberto
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReply(true)}
                      loading={replyLoading}
                      disabled={!replyText.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Responder e Fechar
                    </Button>
                  </div>
                </div>
              )}

              {detail.status === "CLOSED" && (
                <div className="border-t border-glass-border pt-4">
                  <p className="text-sm text-text-muted text-center">Este ticket esta fechado.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Erro ao carregar ticket
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
