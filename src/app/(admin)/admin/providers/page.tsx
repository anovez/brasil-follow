"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
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
import { Select, SelectOption } from "@/components/ui/select"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Wallet,
  Server,
} from "lucide-react"

interface ProviderData {
  id: number
  name: string
  apiUrl: string
  balance: number
  defaultMarkup: number
  currency: string
  exchangeRate: number
  isActive: boolean
  servicesCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<ProviderData[]>([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addApiUrl, setAddApiUrl] = useState("")
  const [addApiKey, setAddApiKey] = useState("")
  const [addMarkup, setAddMarkup] = useState("30")
  const [addCurrency, setAddCurrency] = useState("BRL")
  const [addExchangeRate, setAddExchangeRate] = useState("1")
  const [addLoading, setAddLoading] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editApiUrl, setEditApiUrl] = useState("")
  const [editApiKey, setEditApiKey] = useState("")
  const [editMarkup, setEditMarkup] = useState("")
  const [editCurrency, setEditCurrency] = useState("")
  const [editExchangeRate, setEditExchangeRate] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const [importOpen, setImportOpen] = useState(false)
  const [importId, setImportId] = useState<number | null>(null)
  const [importName, setImportName] = useState("")
  const [importMarkup, setImportMarkup] = useState("")
  const [importLoading, setImportLoading] = useState(false)

  const [balanceLoading, setBalanceLoading] = useState<number | null>(null)
  const [syncLoading, setSyncLoading] = useState<number | null>(null)

  async function fetchProviders() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/providers")
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setProviders(data.providers)
    } catch {
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  async function handleAdd() {
    if (!addName || !addApiUrl || !addApiKey) return
    setAddLoading(true)
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          apiUrl: addApiUrl,
          apiKey: addApiKey,
          defaultMarkup: parseFloat(addMarkup),
          currency: addCurrency,
          exchangeRate: parseFloat(addExchangeRate),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao criar provedor")
        return
      }
      setAddOpen(false)
      setAddName("")
      setAddApiUrl("")
      setAddApiKey("")
      setAddMarkup("30")
      setAddCurrency("BRL")
      setAddExchangeRate("1")
      fetchProviders()
    } catch {
      alert("Erro ao criar provedor")
    } finally {
      setAddLoading(false)
    }
  }

  function openEdit(p: ProviderData) {
    setEditId(p.id)
    setEditName(p.name)
    setEditApiUrl(p.apiUrl)
    setEditApiKey("")
    setEditMarkup(String(p.defaultMarkup))
    setEditCurrency(p.currency)
    setEditExchangeRate(String(p.exchangeRate))
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editId || !editName) return
    setEditLoading(true)
    try {
      const body: Record<string, unknown> = {
        id: editId,
        name: editName,
        apiUrl: editApiUrl,
        defaultMarkup: editMarkup,
        currency: editCurrency,
        exchangeRate: editExchangeRate,
      }
      if (editApiKey) body.apiKey = editApiKey

      const res = await fetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao atualizar provedor")
        return
      }
      setEditOpen(false)
      fetchProviders()
    } catch {
      alert("Erro ao atualizar provedor")
    } finally {
      setEditLoading(false)
    }
  }

  async function handleCheckBalance(id: number) {
    setBalanceLoading(id)
    try {
      const res = await fetch(`/api/admin/providers/${id}/balance`)
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao verificar saldo")
        return
      }
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, balance: data.balance } : p))
      )
      alert(`Saldo de ${data.name}: R$ ${Number(data.balance).toFixed(2)}`)
    } catch {
      alert("Erro ao verificar saldo")
    } finally {
      setBalanceLoading(null)
    }
  }

  function openImport(p: ProviderData) {
    setImportId(p.id)
    setImportName(p.name)
    setImportMarkup(String(p.defaultMarkup))
    setImportOpen(true)
  }

  async function handleImport() {
    if (!importId) return
    setImportLoading(true)
    try {
      const res = await fetch(`/api/admin/providers/${importId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markup: parseFloat(importMarkup) }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao importar servicos")
        return
      }
      alert(
        `Importacao concluida!\n` +
        `Importados: ${data.results.imported}\n` +
        `Ignorados: ${data.results.skipped}\n` +
        `Categorias criadas: ${data.results.categories}`
      )
      setImportOpen(false)
      fetchProviders()
    } catch {
      alert("Erro ao importar servicos")
    } finally {
      setImportLoading(false)
    }
  }

  async function handleResyncPrices(id: number) {
    setSyncLoading(id)
    try {
      const provider = providers.find((p) => p.id === id)
      if (!provider) return
      const res = await fetch(`/api/admin/providers/${id}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markup: provider.defaultMarkup }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao re-sincronizar")
        return
      }
      alert(`Re-sincronizacao concluida! ${data.results.imported} servicos atualizados.`)
    } catch {
      alert("Erro ao re-sincronizar")
    } finally {
      setSyncLoading(null)
    }
  }

  async function handleToggleActive(id: number, currentActive: boolean) {
    try {
      const res = await fetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      if (!res.ok) throw new Error("Erro")
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p))
      )
    } catch {
      alert("Erro ao atualizar provedor")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja desativar este provedor?")) return
    try {
      const res = await fetch(`/api/admin/providers?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro")
      fetchProviders()
    } catch {
      alert("Erro ao desativar provedor")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Server className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Provedores</h1>
        <Button size="sm" className="ml-auto" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Provedor
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Nenhum provedor encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">URL API</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Markup %</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Moeda</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Servicos</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium text-sm">{provider.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-text-muted font-mono max-w-[200px] truncate">
                        {provider.apiUrl}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={`font-mono text-xs ${provider.balance < 50 ? "text-accent-danger" : "text-text-primary"}`}>
                            R$ {provider.balance.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleCheckBalance(provider.id)}
                            disabled={balanceLoading === provider.id}
                            className="text-text-muted hover:text-accent-primary transition-colors"
                          >
                            <RefreshCw className={`h-3 w-3 ${balanceLoading === provider.id ? "animate-spin" : ""}`} />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs hidden sm:table-cell">
                        {provider.defaultMarkup}%
                      </TableCell>
                      <TableCell className="text-center text-xs hidden sm:table-cell">
                        <Badge variant="secondary" className="text-[10px]">
                          {provider.currency}
                          {provider.currency !== "BRL" && ` (${provider.exchangeRate}x)`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        <Badge variant="secondary" className="text-[10px]">
                          {provider.servicesCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={provider.isActive}
                          onCheckedChange={() => handleToggleActive(provider.id, provider.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleCheckBalance(provider.id)}>
                              <Wallet className="h-4 w-4 mr-2" />
                              Verificar Saldo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openImport(provider)}>
                              <Download className="h-4 w-4 mr-2" />
                              Importar Servicos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResyncPrices(provider.id)}
                              disabled={syncLoading === provider.id}
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading === provider.id ? "animate-spin" : ""}`} />
                              Re-sincronizar Precos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEdit(provider)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(provider.id)}>
                              <Trash2 className="h-4 w-4 mr-2 text-accent-danger" />
                              Desativar
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
        </CardContent>
      </Card>

      {/* Add Provider Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Provedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Nome</label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Ex: SMMPanel BR" />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">URL da API</label>
              <Input value={addApiUrl} onChange={(e) => setAddApiUrl(e.target.value)} placeholder="https://api.provider.com/v2" />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Chave da API</label>
              <Input value={addApiKey} onChange={(e) => setAddApiKey(e.target.value)} placeholder="Sua chave de API" type="password" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Markup %</label>
                <Input type="number" value={addMarkup} onChange={(e) => setAddMarkup(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Moeda</label>
                <Select value={addCurrency} onChange={(e) => setAddCurrency(e.target.value)}>
                  <SelectOption value="BRL">BRL</SelectOption>
                  <SelectOption value="USD">USD</SelectOption>
                  <SelectOption value="EUR">EUR</SelectOption>
                </Select>
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Taxa Cambio</label>
                <Input type="number" step="0.01" value={addExchangeRate} onChange={(e) => setAddExchangeRate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button loading={addLoading} onClick={handleAdd} disabled={!addName || !addApiUrl || !addApiKey}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Provedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">URL da API</label>
              <Input value={editApiUrl} onChange={(e) => setEditApiUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Nova Chave da API (deixe vazio para manter)</label>
              <Input value={editApiKey} onChange={(e) => setEditApiKey(e.target.value)} type="password" placeholder="Deixe vazio para manter a atual" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Markup %</label>
                <Input type="number" value={editMarkup} onChange={(e) => setEditMarkup(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Moeda</label>
                <Select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)}>
                  <SelectOption value="BRL">BRL</SelectOption>
                  <SelectOption value="USD">USD</SelectOption>
                  <SelectOption value="EUR">EUR</SelectOption>
                </Select>
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Taxa Cambio</label>
                <Input type="number" step="0.01" value={editExchangeRate} onChange={(e) => setEditExchangeRate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button loading={editLoading} onClick={handleEdit} disabled={!editName}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Services Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Servicos</DialogTitle>
            <DialogDescription>
              Importar todos os servicos de <strong>{importName}</strong>.
              Servicos existentes serao atualizados, novos serao criados.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="text-sm text-text-secondary mb-1.5 block">Markup (%)</label>
            <Input
              type="number"
              min="0"
              step="1"
              value={importMarkup}
              onChange={(e) => setImportMarkup(e.target.value)}
            />
            <p className="text-xs text-text-muted mt-1">
              O preco de venda sera: custo x (1 + markup/100)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button loading={importLoading} onClick={handleImport}>
              <Download className="h-4 w-4 mr-1" />
              Importar Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
