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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderOpen,
} from "lucide-react"

interface CategoryData {
  id: number
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
  servicesCount: number
  createdAt: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addSlug, setAddSlug] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editSortOrder, setEditSortOrder] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  async function fetchCategories() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/categories")
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setCategories(data.categories)
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  async function handleAdd() {
    if (!addName) return
    setAddLoading(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName, slug: addSlug || generateSlug(addName) }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao criar categoria")
        return
      }
      setAddOpen(false)
      setAddName("")
      setAddSlug("")
      fetchCategories()
    } catch {
      alert("Erro ao criar categoria")
    } finally {
      setAddLoading(false)
    }
  }

  function openEdit(cat: CategoryData) {
    setEditId(cat.id)
    setEditName(cat.name)
    setEditSlug(cat.slug)
    setEditSortOrder(String(cat.sortOrder))
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editId || !editName) return
    setEditLoading(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          name: editName,
          slug: editSlug,
          sortOrder: editSortOrder,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao atualizar categoria")
        return
      }
      setEditOpen(false)
      fetchCategories()
    } catch {
      alert("Erro ao atualizar categoria")
    } finally {
      setEditLoading(false)
    }
  }

  async function handleToggleActive(id: number, currentActive: boolean) {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      if (!res.ok) throw new Error("Erro")
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !currentActive } : c))
      )
    } catch {
      alert("Erro ao atualizar categoria")
    }
  }

  async function handleReorder(id: number, direction: "up" | "down") {
    const index = categories.findIndex((c) => c.id === id)
    if (index === -1) return
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= categories.length) return

    const current = categories[index]
    const swap = categories[swapIndex]

    try {
      await Promise.all([
        fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: current.id, sortOrder: swap.sortOrder }),
        }),
        fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: swap.id, sortOrder: current.sortOrder }),
        }),
      ])
      fetchCategories()
    } catch {
      alert("Erro ao reordenar")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja desativar esta categoria?")) return
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro")
      fetchCategories()
    } catch {
      alert("Erro ao desativar categoria")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderOpen className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Categorias</h1>
        <Button size="sm" className="ml-auto" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Categoria
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Nenhuma categoria encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Slug</TableHead>
                    <TableHead className="text-center">Ordem</TableHead>
                    <TableHead className="text-center">Servicos</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat, index) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-mono text-xs">#{cat.id}</TableCell>
                      <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-text-muted font-mono">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleReorder(cat.id, "up")}
                            disabled={index === 0}
                            className="text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-mono w-6 text-center">{cat.sortOrder}</span>
                          <button
                            onClick={() => handleReorder(cat.id, "down")}
                            disabled={index === categories.length - 1}
                            className="text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">
                          {cat.servicesCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={cat.isActive}
                          onCheckedChange={() => handleToggleActive(cat.id, cat.isActive)}
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
                            <DropdownMenuItem onClick={() => openEdit(cat)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(cat.id)}>
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

      {/* Add Category Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Nome</label>
              <Input
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value)
                  setAddSlug(generateSlug(e.target.value))
                }}
                placeholder="Ex: Instagram Seguidores"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Slug (auto-gerado)</label>
              <Input
                value={addSlug}
                onChange={(e) => setAddSlug(e.target.value)}
                placeholder="instagram-seguidores"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button loading={addLoading} onClick={handleAdd} disabled={!addName}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Slug</label>
              <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Ordem</label>
              <Input
                type="number"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button loading={editLoading} onClick={handleEdit} disabled={!editName}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
