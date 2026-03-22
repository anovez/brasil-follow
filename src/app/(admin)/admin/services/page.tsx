"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectOption } from "@/components/ui/select"
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
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Percent,
  CheckSquare,
} from "lucide-react"

interface ServiceData {
  id: number
  name: string
  description: string | null
  category: { id: number; name: string }
  provider: { id: number; name: string }
  pricePerThousand: number
  costPerThousand: number
  profitMargin: number
  minQuantity: number
  maxQuantity: number
  providerServiceId: string
  type: string
  quality: string
  dripfeed: boolean
  refill: boolean
  refillDays: number
  isActive: boolean
  sortOrder: number
  ordersCount: number
  createdAt: string
}

interface CategoryOption {
  id: number
  name: string
}

interface ProviderOption {
  id: number
  name: string
}

const qualityEmojis: Record<string, string> = {
  baixa: "1/5",
  media: "2/5",
  boa: "3/5",
  otima: "4/5",
  premium: "5/5",
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [providerFilter, setProviderFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [providers, setProviders] = useState<ProviderOption[]>([])

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [markupOpen, setMarkupOpen] = useState(false)
  const [markupValue, setMarkupValue] = useState("30")
  const [markupLoading, setMarkupLoading] = useState(false)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      })
      if (search) params.set("search", search)
      if (categoryFilter) params.set("categoryId", categoryFilter)
      if (providerFilter) params.set("providerId", providerFilter)

      const res = await fetch(`/api/admin/services?${params}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setServices(data.services)
      setTotalPages(data.totalPages)
      setTotal(data.total)

      // Extract unique categories and providers
      const cats = new Map<number, string>()
      const provs = new Map<number, string>()
      for (const s of data.services) {
        cats.set(s.category.id, s.category.name)
        provs.set(s.provider.id, s.provider.name)
      }
      if (categories.length === 0) {
        setCategories(Array.from(cats.entries()).map(([id, name]) => ({ id, name })))
      }
      if (providers.length === 0) {
        setProviders(Array.from(provs.entries()).map(([id, name]) => ({ id, name })))
      }
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, providerFilter, page])

  useEffect(() => {
    // Fetch categories and providers on mount
    async function fetchFilters() {
      try {
        const [catRes, provRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/providers"),
        ])
        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(catData.categories.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })))
        }
        if (provRes.ok) {
          const provData = await provRes.json()
          setProviders(provData.providers.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })))
        }
      } catch {
        // ignore
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchServices(), 300)
    return () => clearTimeout(timer)
  }, [fetchServices])

  async function handleToggleActive(id: number, currentActive: boolean) {
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      if (!res.ok) throw new Error("Erro")
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !currentActive } : s))
      )
    } catch {
      alert("Erro ao atualizar servico")
    }
  }

  async function handleInlineEdit(id: number) {
    const newPrice = parseFloat(editValue)
    if (isNaN(newPrice) || newPrice <= 0) {
      setEditingId(null)
      return
    }
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pricePerThousand: newPrice }),
      })
      if (!res.ok) throw new Error("Erro")
      setServices((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s
          const margin = s.costPerThousand > 0
            ? Math.round(((newPrice - s.costPerThousand) / s.costPerThousand) * 10000) / 100
            : 0
          return { ...s, pricePerThousand: newPrice, profitMargin: margin }
        })
      )
    } catch {
      alert("Erro ao atualizar preco")
    }
    setEditingId(null)
  }

  async function handleBulkMarkup() {
    if (selected.size === 0) return
    setMarkupLoading(true)
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-markup",
          serviceIds: Array.from(selected),
          markup: markupValue,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao aplicar markup")
        return
      }
      alert(`Markup aplicado a ${data.updated} servicos`)
      setSelected(new Set())
      setMarkupOpen(false)
      fetchServices()
    } catch {
      alert("Erro ao aplicar markup")
    } finally {
      setMarkupLoading(false)
    }
  }

  function toggleSelect(id: number) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (selected.size === services.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(services.map((s) => s.id)))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Servicos</h1>
        <Badge variant="secondary" className="ml-auto">{total} total</Badge>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="w-full md:w-48">
              <SelectOption value="">Todas Categorias</SelectOption>
              {categories.map((c) => (
                <SelectOption key={c.id} value={String(c.id)}>{c.name}</SelectOption>
              ))}
            </Select>
            <Select value={providerFilter} onChange={(e) => { setProviderFilter(e.target.value); setPage(1) }} className="w-full md:w-48">
              <SelectOption value="">Todos Provedores</SelectOption>
              {providers.map((p) => (
                <SelectOption key={p.id} value={String(p.id)}>{p.name}</SelectOption>
              ))}
            </Select>
          </div>
          {selected.size > 0 && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => setMarkupOpen(true)}>
                <Percent className="h-4 w-4 mr-1" />
                Aplicar Markup ({selected.size})
              </Button>
            </div>
          )}
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
          ) : services.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Nenhum servico encontrado
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
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-right">Custo/1k</TableHead>
                    <TableHead className="text-right">Preco/1k</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Lucro %</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Min</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Max</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Qualidade</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id} className={selected.has(service.id) ? "bg-accent-primary/5" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(service.id)}
                          onChange={() => toggleSelect(service.id)}
                          className="rounded border-glass-border"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">#{service.id}</TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="text-xs font-medium text-text-primary truncate">{service.name}</p>
                          <p className="text-[10px] text-text-muted">{service.provider.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-text-secondary">
                        {service.category.name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        R$ {service.costPerThousand.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {editingId === service.id ? (
                          <Input
                            type="number"
                            step="0.0001"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineEdit(service.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleInlineEdit(service.id)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                            className="w-24 h-7 text-xs"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(service.id)
                              setEditValue(service.pricePerThousand.toFixed(4))
                            }}
                            className="hover:text-accent-primary transition-colors cursor-pointer"
                            title="Clique para editar"
                          >
                            R$ {service.pricePerThousand.toFixed(4)}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs hidden sm:table-cell ${service.profitMargin >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
                        {service.profitMargin.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs hidden lg:table-cell">
                        {service.minQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs hidden lg:table-cell">
                        {service.maxQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell text-xs">
                        <Badge variant={service.quality === "premium" || service.quality === "otima" ? "success" : service.quality === "boa" ? "default" : "secondary"} className="text-[10px]">
                          {qualityEmojis[service.quality] || service.quality}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() => handleToggleActive(service.id, service.isActive)}
                        />
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

      {/* Bulk Markup Dialog */}
      <Dialog open={markupOpen} onOpenChange={setMarkupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Markup em Massa</DialogTitle>
            <DialogDescription>
              Aplicar markup sobre o custo para {selected.size} servico(s) selecionado(s).
              O preco de venda sera calculado como: custo x (1 + markup/100)
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="text-sm text-text-secondary mb-1.5 block">Markup (%)</label>
            <Input
              type="number"
              min="0"
              step="1"
              value={markupValue}
              onChange={(e) => setMarkupValue(e.target.value)}
              placeholder="30"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkupOpen(false)}>
              Cancelar
            </Button>
            <Button loading={markupLoading} onClick={handleBulkMarkup}>
              Aplicar Markup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
