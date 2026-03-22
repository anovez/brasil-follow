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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  MoreHorizontal,
  Eye,
  Plus,
  Minus,
  Shield,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react"

interface UserData {
  id: number
  name: string
  email: string
  username: string
  image: string | null
  role: string
  status: string
  level: string
  balance: number
  totalSpent: number
  createdAt: string
  ordersCount: number
  paymentsCount: number
  referralsCount: number
}

interface UserDetail {
  user: UserData & {
    affiliateCode: string
    updatedAt: string
    referredBy: { id: number; name: string; email: string } | null
    _count: { orders: number; payments: number; referrals: number }
  }
  orders?: Array<{
    id: number
    service: string
    link: string
    quantity: number
    amount: number
    cost: number
    profit: number
    status: string
    createdAt: string
  }>
  payments?: Array<{
    id: number
    amount: number
    method: string
    status: string
    paidAt: string | null
    createdAt: string
  }>
  affiliates?: {
    referrals: Array<{
      id: number
      name: string
      email: string
      totalSpent: number
      createdAt: string
    }>
    earnings: Array<{
      id: number
      referredUser: string
      amount: number
      percentage: number
      status: string
      createdAt: string
    }>
    totalEarnings: number
  }
  balanceLogs?: Array<{
    id: number
    amount: number
    balanceAfter: number
    type: string
    description: string
    adminId: number | null
    createdAt: string
  }>
}

const roleLabels: Record<string, string> = {
  USER: "Usuário",
  RESELLER: "Revenda",
  ADMIN: "Admin",
}

const roleBadgeVariant: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  USER: "secondary",
  RESELLER: "default",
  ADMIN: "danger",
}

const statusBadgeVariant: Record<string, "success" | "danger"> = {
  ACTIVE: "success",
  BANNED: "danger",
}

const levelColors: Record<string, string> = {
  BRONZE: "text-orange-400",
  SILVER: "text-gray-300",
  GOLD: "text-yellow-400",
  PLATINUM: "text-cyan-300",
  DIAMOND: "text-purple-400",
}

const orderStatusVariant: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  PENDING: "warning",
  PROCESSING: "default",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  PARTIAL: "warning",
  CANCELLED: "danger",
  FAILED: "danger",
  REFUNDED: "secondary",
}

const orderStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  PARTIAL: "Parcial",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
}

const paymentStatusVariant: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  PAID: "success",
  EXPIRED: "danger",
  CANCELLED: "danger",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null)
  const [detailTab, setDetailTab] = useState("orders")
  const [detailLoading, setDetailLoading] = useState(false)

  const [balanceOpen, setBalanceOpen] = useState(false)
  const [balanceAction, setBalanceAction] = useState<"add" | "remove">("add")
  const [balanceUserId, setBalanceUserId] = useState<number | null>(null)
  const [balanceUserName, setBalanceUserName] = useState("")
  const [balanceAmount, setBalanceAmount] = useState("")
  const [balanceReason, setBalanceReason] = useState("")
  const [balanceLoading, setBalanceLoading] = useState(false)

  const [roleOpen, setRoleOpen] = useState(false)
  const [roleUserId, setRoleUserId] = useState<number | null>(null)
  const [roleUserName, setRoleUserName] = useState("")
  const [roleValue, setRoleValue] = useState("USER")
  const [roleLoading, setRoleLoading] = useState(false)

  const [banOpen, setBanOpen] = useState(false)
  const [banUserId, setBanUserId] = useState<number | null>(null)
  const [banUserName, setBanUserName] = useState("")
  const [banCurrentStatus, setBanCurrentStatus] = useState("")
  const [banLoading, setBanLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
        level: levelFilter,
        page: page.toString(),
        limit: "20",
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter, levelFilter, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  async function openDetail(userId: number, tab: string = "orders") {
    setDetailTab(tab)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}?tab=${tab}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setDetailUser(data)
    } catch {
      setDetailUser(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function loadDetailTab(tab: string) {
    if (!detailUser) return
    setDetailTab(tab)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${detailUser.user.id}?tab=${tab}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setDetailUser((prev) => (prev ? { ...prev, ...data } : data))
    } catch {
      // keep existing data
    } finally {
      setDetailLoading(false)
    }
  }

  function openBalanceDialog(userId: number, name: string, action: "add" | "remove") {
    setBalanceUserId(userId)
    setBalanceUserName(name)
    setBalanceAction(action)
    setBalanceAmount("")
    setBalanceReason("")
    setBalanceOpen(true)
  }

  async function submitBalance() {
    if (!balanceUserId || !balanceAmount || !balanceReason) return
    setBalanceLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${balanceUserId}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: balanceAmount,
          description: balanceReason,
          action: balanceAction,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Erro ao ajustar saldo")
        return
      }
      setBalanceOpen(false)
      fetchUsers()
    } catch {
      alert("Erro ao ajustar saldo")
    } finally {
      setBalanceLoading(false)
    }
  }

  function openRoleDialog(userId: number, name: string, currentRole: string) {
    setRoleUserId(userId)
    setRoleUserName(name)
    setRoleValue(currentRole)
    setRoleOpen(true)
  }

  async function submitRole() {
    if (!roleUserId) return
    setRoleLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${roleUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleValue }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Erro ao alterar role")
        return
      }
      setRoleOpen(false)
      fetchUsers()
    } catch {
      alert("Erro ao alterar role")
    } finally {
      setRoleLoading(false)
    }
  }

  function openBanDialog(userId: number, name: string, currentStatus: string) {
    setBanUserId(userId)
    setBanUserName(name)
    setBanCurrentStatus(currentStatus)
    setBanOpen(true)
  }

  async function submitBan() {
    if (!banUserId) return
    setBanLoading(true)
    const newStatus = banCurrentStatus === "BANNED" ? "ACTIVE" : "BANNED"
    try {
      const res = await fetch(`/api/admin/users/${banUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Erro ao alterar status")
        return
      }
      setBanOpen(false)
      fetchUsers()
    } catch {
      alert("Erro ao alterar status")
    } finally {
      setBanLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Usuários</h1>
        <Badge variant="secondary" className="ml-auto">{total} total</Badge>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Buscar por email, username ou nome..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="w-full md:w-36">
              <SelectOption value="ALL">Todos Roles</SelectOption>
              <SelectOption value="USER">Usuário</SelectOption>
              <SelectOption value="RESELLER">Revenda</SelectOption>
              <SelectOption value="ADMIN">Admin</SelectOption>
            </Select>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-full md:w-36">
              <SelectOption value="ALL">Todos Status</SelectOption>
              <SelectOption value="ACTIVE">Ativo</SelectOption>
              <SelectOption value="BANNED">Banido</SelectOption>
            </Select>
            <Select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1) }} className="w-full md:w-36">
              <SelectOption value="ALL">Todos Níveis</SelectOption>
              <SelectOption value="BRONZE">Bronze</SelectOption>
              <SelectOption value="SILVER">Prata</SelectOption>
              <SelectOption value="GOLD">Ouro</SelectOption>
              <SelectOption value="PLATINUM">Platina</SelectOption>
              <SelectOption value="DIAMOND">Diamante</SelectOption>
            </Select>
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
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Username</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Gasto</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Nível</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Cadastro</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">#{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-text-secondary text-xs">{user.email}</TableCell>
                      <TableCell className="hidden lg:table-cell text-text-muted text-xs">@{user.username}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        R$ {user.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs hidden sm:table-cell">
                        R$ {user.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <span className={`text-xs font-semibold ${levelColors[user.level] || "text-text-muted"}`}>
                          {user.level}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={roleBadgeVariant[user.role] || "secondary"} className="text-[10px]">
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusBadgeVariant[user.status] || "secondary"} className="text-[10px]">
                          {user.status === "ACTIVE" ? "Ativo" : "Banido"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-text-muted text-xs hidden lg:table-cell">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openDetail(user.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openBalanceDialog(user.id, user.name, "add")}>
                              <Plus className="h-4 w-4 mr-2 text-accent-success" />
                              Adicionar saldo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openBalanceDialog(user.id, user.name, "remove")}>
                              <Minus className="h-4 w-4 mr-2 text-accent-danger" />
                              Remover saldo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openRoleDialog(user.id, user.name, user.role)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Alterar role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openBanDialog(user.id, user.name, user.status)}>
                              {user.status === "BANNED" ? (
                                <>
                                  <Check className="h-4 w-4 mr-2 text-accent-success" />
                                  Desbanir
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2 text-accent-danger" />
                                  Banir
                                </>
                              )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-glass-border">
              <p className="text-sm text-text-muted">
                Página {page} de {totalPages} ({total} resultados)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailUser?.user.name || "Detalhes do Usuário"}
            </DialogTitle>
            <DialogDescription>
              {detailUser && (
                <span className="flex items-center gap-2 mt-1">
                  <span>@{detailUser.user.username}</span>
                  <span className="text-text-muted">|</span>
                  <span>{detailUser.user.email}</span>
                  <span className="text-text-muted">|</span>
                  <span>Saldo: R$ {Number(detailUser.user.balance).toFixed(2)}</span>
                  <span className="text-text-muted">|</span>
                  <span>Código: {detailUser.user.affiliateCode}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={detailTab} onValueChange={(v) => loadDetailTab(v)}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
              <TabsTrigger value="balance">Log de Saldo</TabsTrigger>
            </TabsList>

            {detailLoading ? (
              <div className="space-y-2 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="orders">
                  {detailUser?.orders && detailUser.orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-glass-border">
                            <th className="text-left py-2 px-2 text-text-muted">ID</th>
                            <th className="text-left py-2 px-2 text-text-muted">Serviço</th>
                            <th className="text-right py-2 px-2 text-text-muted">Qtd</th>
                            <th className="text-right py-2 px-2 text-text-muted">Valor</th>
                            <th className="text-right py-2 px-2 text-text-muted">Lucro</th>
                            <th className="text-center py-2 px-2 text-text-muted">Status</th>
                            <th className="text-right py-2 px-2 text-text-muted">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailUser.orders.map((o) => (
                            <tr key={o.id} className="border-b border-glass-border/50">
                              <td className="py-2 px-2 font-mono">#{o.id}</td>
                              <td className="py-2 px-2 max-w-[150px] truncate text-text-secondary">{o.service}</td>
                              <td className="py-2 px-2 text-right font-mono">{o.quantity}</td>
                              <td className="py-2 px-2 text-right font-mono">R$ {o.amount.toFixed(2)}</td>
                              <td className={`py-2 px-2 text-right font-mono ${o.profit >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                                R$ {o.profit.toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <Badge variant={orderStatusVariant[o.status] || "secondary"} className="text-[10px]">
                                  {orderStatusLabels[o.status] || o.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-2 text-right text-text-muted">
                                {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm py-8 text-center">Nenhum pedido encontrado</p>
                  )}
                </TabsContent>

                <TabsContent value="payments">
                  {detailUser?.payments && detailUser.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-glass-border">
                            <th className="text-left py-2 px-2 text-text-muted">ID</th>
                            <th className="text-right py-2 px-2 text-text-muted">Valor</th>
                            <th className="text-center py-2 px-2 text-text-muted">Método</th>
                            <th className="text-center py-2 px-2 text-text-muted">Status</th>
                            <th className="text-right py-2 px-2 text-text-muted">Pago em</th>
                            <th className="text-right py-2 px-2 text-text-muted">Criado em</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailUser.payments.map((p) => (
                            <tr key={p.id} className="border-b border-glass-border/50">
                              <td className="py-2 px-2 font-mono">#{p.id}</td>
                              <td className="py-2 px-2 text-right font-mono">R$ {p.amount.toFixed(2)}</td>
                              <td className="py-2 px-2 text-center">{p.method}</td>
                              <td className="py-2 px-2 text-center">
                                <Badge variant={paymentStatusVariant[p.status] || "secondary"} className="text-[10px]">
                                  {p.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-2 text-right text-text-muted">
                                {p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "-"}
                              </td>
                              <td className="py-2 px-2 text-right text-text-muted">
                                {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm py-8 text-center">Nenhum pagamento encontrado</p>
                  )}
                </TabsContent>

                <TabsContent value="affiliates">
                  {detailUser?.affiliates ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-text-muted">
                          Indicados: <strong className="text-text-primary">{detailUser.affiliates.referrals.length}</strong>
                        </span>
                        <span className="text-text-muted">
                          Ganhos totais: <strong className="text-accent-success">R$ {detailUser.affiliates.totalEarnings.toFixed(2)}</strong>
                        </span>
                      </div>

                      {detailUser.affiliates.referrals.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Indicados</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-glass-border">
                                  <th className="text-left py-2 px-2 text-text-muted">ID</th>
                                  <th className="text-left py-2 px-2 text-text-muted">Nome</th>
                                  <th className="text-left py-2 px-2 text-text-muted">Email</th>
                                  <th className="text-right py-2 px-2 text-text-muted">Total Gasto</th>
                                  <th className="text-right py-2 px-2 text-text-muted">Cadastro</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailUser.affiliates.referrals.map((r) => (
                                  <tr key={r.id} className="border-b border-glass-border/50">
                                    <td className="py-2 px-2 font-mono">#{r.id}</td>
                                    <td className="py-2 px-2">{r.name}</td>
                                    <td className="py-2 px-2 text-text-secondary">{r.email}</td>
                                    <td className="py-2 px-2 text-right font-mono">R$ {r.totalSpent.toFixed(2)}</td>
                                    <td className="py-2 px-2 text-right text-text-muted">
                                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {detailUser.affiliates.earnings.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Ganhos</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-glass-border">
                                  <th className="text-left py-2 px-2 text-text-muted">ID</th>
                                  <th className="text-left py-2 px-2 text-text-muted">Indicado</th>
                                  <th className="text-right py-2 px-2 text-text-muted">Valor</th>
                                  <th className="text-right py-2 px-2 text-text-muted">%</th>
                                  <th className="text-center py-2 px-2 text-text-muted">Status</th>
                                  <th className="text-right py-2 px-2 text-text-muted">Data</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailUser.affiliates.earnings.map((e) => (
                                  <tr key={e.id} className="border-b border-glass-border/50">
                                    <td className="py-2 px-2 font-mono">#{e.id}</td>
                                    <td className="py-2 px-2">{e.referredUser}</td>
                                    <td className="py-2 px-2 text-right font-mono text-accent-success">
                                      R$ {e.amount.toFixed(2)}
                                    </td>
                                    <td className="py-2 px-2 text-right">{e.percentage}%</td>
                                    <td className="py-2 px-2 text-center">
                                      <Badge variant={e.status === "PAID" ? "success" : "warning"} className="text-[10px]">
                                        {e.status}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-2 text-right text-text-muted">
                                      {new Date(e.createdAt).toLocaleDateString("pt-BR")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm py-8 text-center">Nenhum dado de afiliado</p>
                  )}
                </TabsContent>

                <TabsContent value="balance">
                  {detailUser?.balanceLogs && detailUser.balanceLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-glass-border">
                            <th className="text-left py-2 px-2 text-text-muted">ID</th>
                            <th className="text-left py-2 px-2 text-text-muted">Tipo</th>
                            <th className="text-right py-2 px-2 text-text-muted">Valor</th>
                            <th className="text-right py-2 px-2 text-text-muted">Saldo Após</th>
                            <th className="text-left py-2 px-2 text-text-muted">Descrição</th>
                            <th className="text-right py-2 px-2 text-text-muted">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailUser.balanceLogs.map((l) => (
                            <tr key={l.id} className="border-b border-glass-border/50">
                              <td className="py-2 px-2 font-mono">#{l.id}</td>
                              <td className="py-2 px-2">
                                <Badge
                                  variant={l.amount >= 0 ? "success" : "danger"}
                                  className="text-[10px]"
                                >
                                  {l.type}
                                </Badge>
                              </td>
                              <td className={`py-2 px-2 text-right font-mono ${l.amount >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                                {l.amount >= 0 ? "+" : ""}R$ {l.amount.toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono">R$ {l.balanceAfter.toFixed(2)}</td>
                              <td className="py-2 px-2 text-text-secondary max-w-[200px] truncate">{l.description}</td>
                              <td className="py-2 px-2 text-right text-text-muted">
                                {new Date(l.createdAt).toLocaleString("pt-BR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm py-8 text-center">Nenhum log de saldo</p>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {balanceAction === "add" ? "Adicionar Saldo" : "Remover Saldo"}
            </DialogTitle>
            <DialogDescription>
              Usuário: <strong>{balanceUserName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Valor (R$)</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Motivo</label>
              <Textarea
                placeholder="Descreva o motivo do ajuste..."
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={balanceAction === "add" ? "default" : "destructive"}
              loading={balanceLoading}
              onClick={submitBalance}
              disabled={!balanceAmount || !balanceReason}
            >
              {balanceAction === "add" ? "Adicionar" : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role</DialogTitle>
            <DialogDescription>
              Usuário: <strong>{roleUserName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="text-sm text-text-secondary mb-1.5 block">Nova Role</label>
            <Select value={roleValue} onChange={(e) => setRoleValue(e.target.value)}>
              <SelectOption value="USER">Usuário</SelectOption>
              <SelectOption value="RESELLER">Revenda</SelectOption>
              <SelectOption value="ADMIN">Admin</SelectOption>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>
              Cancelar
            </Button>
            <Button loading={roleLoading} onClick={submitRole}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Dialog */}
      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banCurrentStatus === "BANNED" ? "Desbanir Usuário" : "Banir Usuário"}
            </DialogTitle>
            <DialogDescription>
              {banCurrentStatus === "BANNED"
                ? `Tem certeza que deseja desbanir ${banUserName}?`
                : `Tem certeza que deseja banir ${banUserName}? O usuário não conseguirá acessar a plataforma.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={banCurrentStatus === "BANNED" ? "default" : "destructive"}
              loading={banLoading}
              onClick={submitBan}
            >
              {banCurrentStatus === "BANNED" ? "Desbanir" : "Banir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
