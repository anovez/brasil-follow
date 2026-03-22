"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"

const newTicketSchema = z.object({
  subject: z.string().min(3, "Assunto deve ter no minimo 3 caracteres").max(255),
  message: z.string().min(10, "Mensagem deve ter no minimo 10 caracteres"),
})

const replySchema = z.object({
  message: z.string().min(1, "Mensagem nao pode ser vazia"),
})

type NewTicketData = z.infer<typeof newTicketSchema>
type ReplyData = z.infer<typeof replySchema>

interface Ticket {
  id: number
  subject: string
  status: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface TicketMessage {
  id: number
  message: string
  isAdmin: boolean
  userName: string
  userRole: string
  createdAt: string
}

interface TicketDetail {
  id: number
  subject: string
  status: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

const statusConfig: Record<string, { label: string; variant: "success" | "default" | "secondary"; icon: React.ReactNode }> = {
  OPEN: {
    label: "Aberto",
    variant: "success",
    icon: <Clock className="h-3 w-3" />,
  },
  ANSWERED: {
    label: "Respondido",
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  CUSTOMER_REPLY: {
    label: "Aguardando",
    variant: "success",
    icon: <Clock className="h-3 w-3" />,
  },
  CLOSED: {
    label: "Fechado",
    variant: "secondary",
    icon: <XCircle className="h-3 w-3" />,
  },
}

export default function SupportPage() {
  const queryClient = useQueryClient()
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  // Fetch tickets list
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await fetch("/api/tickets")
      if (!res.ok) throw new Error("Failed to fetch tickets")
      const json = await res.json()
      return json.data as Ticket[]
    },
    staleTime: 15000,
  })

  // Fetch single ticket detail
  const { data: ticketDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["ticket", selectedTicketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${selectedTicketId}`)
      if (!res.ok) throw new Error("Failed to fetch ticket")
      const json = await res.json()
      return json.data as TicketDetail
    },
    enabled: selectedTicketId !== null,
    staleTime: 10000,
    refetchInterval: selectedTicketId ? 15000 : false,
  })

  // New ticket form
  const {
    register: registerTicket,
    handleSubmit: handleSubmitTicket,
    reset: resetTicket,
    formState: { errors: ticketErrors },
  } = useForm<NewTicketData>({
    resolver: zodResolver(newTicketSchema),
  })

  // Reply form
  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    reset: resetReply,
    formState: { errors: replyErrors },
  } = useForm<ReplyData>({
    resolver: zodResolver(replySchema),
  })

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: NewTicketData) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Erro ao criar ticket")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success("Ticket criado com sucesso!")
      resetTicket()
      setShowNewTicket(false)
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      if (data.data?.id) {
        setSelectedTicketId(data.data.id)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data: ReplyData) => {
      const res = await fetch(`/api/tickets/${selectedTicketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Erro ao enviar resposta")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Resposta enviada!")
      resetReply()
      queryClient.invalidateQueries({ queryKey: ["ticket", selectedTicketId] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Ticket detail view
  if (selectedTicketId !== null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTicketId(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Ticket #{selectedTicketId}
            </h1>
            {ticketDetail && (
              <p className="text-sm text-text-secondary">{ticketDetail.subject}</p>
            )}
          </div>
          {ticketDetail && (
            <Badge
              variant={statusConfig[ticketDetail.status]?.variant || "secondary"}
              className="ml-auto"
            >
              {statusConfig[ticketDetail.status]?.icon}
              {statusConfig[ticketDetail.status]?.label || ticketDetail.status}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            {detailLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : ticketDetail ? (
              <div className="space-y-4">
                {/* Messages */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {ticketDetail.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.isAdmin
                            ? "bg-accent-primary/10 border border-accent-primary/20"
                            : "bg-glass-bg border border-glass-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-text-primary">
                            {msg.isAdmin ? "Admin" : msg.userName || "Voce"}
                          </span>
                          {msg.isAdmin && (
                            <Badge variant="default" className="text-xs px-1.5 py-0">
                              <Shield className="h-2.5 w-2.5 mr-0.5" />
                              Admin
                            </Badge>
                          )}
                          <span className="text-xs text-text-muted ml-auto">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply form */}
                {ticketDetail.status !== "CLOSED" && (
                  <form
                    onSubmit={handleSubmitReply((data) => replyMutation.mutate(data))}
                    className="border-t border-glass-border pt-4"
                  >
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Digite sua resposta..."
                          className="min-h-[60px]"
                          {...registerReply("message")}
                        />
                        {replyErrors.message && (
                          <p className="text-xs text-accent-danger mt-1">
                            {replyErrors.message.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        size="icon"
                        className="h-[60px] w-12"
                        loading={replyMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}

                {ticketDetail.status === "CLOSED" && (
                  <div className="border-t border-glass-border pt-4 text-center">
                    <p className="text-sm text-text-muted">
                      Este ticket esta fechado. Abra um novo ticket se precisar de ajuda.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-secondary text-center py-8">
                Ticket nao encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tickets list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Suporte</h1>
          <p className="text-text-secondary mt-1">
            Abra um ticket e nossa equipe respondera em breve.
          </p>
        </div>
        <Button onClick={() => setShowNewTicket(true)}>
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Meus Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !tickets?.length ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Nenhum ticket encontrado</p>
              <p className="text-sm text-text-muted mt-1">
                Abra um ticket se precisar de ajuda
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => {
                const config = statusConfig[ticket.status] || statusConfig.OPEN
                return (
                  <div
                    key={ticket.id}
                    className="rounded-lg border border-glass-border bg-glass-bg p-4 cursor-pointer hover:border-accent-primary/30 transition-colors"
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-text-muted font-mono">
                            #{ticket.id}
                          </span>
                          <Badge variant={config.variant} className="flex items-center gap-1">
                            {config.icon}
                            {config.label}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs text-text-muted mt-1">
                          {ticket.messageCount} mensagen{ticket.messageCount !== 1 ? "s" : ""} |{" "}
                          Atualizado: {formatDate(ticket.updatedAt)}
                        </p>
                      </div>
                      <span className="text-xs text-text-muted flex-shrink-0">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Ticket de Suporte</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitTicket((data) => createTicketMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Descreva brevemente o problema..."
                {...registerTicket("subject")}
              />
              {ticketErrors.subject && (
                <p className="text-xs text-accent-danger">{ticketErrors.subject.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Descreva o problema em detalhes. Inclua IDs de pedidos se aplicavel..."
                className="min-h-[120px]"
                {...registerTicket("message")}
              />
              {ticketErrors.message && (
                <p className="text-xs text-accent-danger">{ticketErrors.message.message}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Cancelar
              </DialogClose>
              <Button type="submit" loading={createTicketMutation.isPending}>
                <Send className="h-4 w-4" />
                Enviar Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
