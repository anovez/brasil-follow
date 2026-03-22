"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ShoppingCart, Grid3X3, List } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useServices } from "@/hooks/useServices"
import { formatCurrency } from "@/lib/utils"

const qualityConfig: Record<string, { emoji: string; label: string; color: string }> = {
  premium: { emoji: "👑", label: "Premium", color: "text-yellow-400" },
  alta: { emoji: "🏆", label: "Alta", color: "text-amber-400" },
  media: { emoji: "🥈", label: "Media", color: "text-gray-300" },
  baixa: { emoji: "🥉", label: "Baixa", color: "text-amber-700" },
  teste: { emoji: "💎", label: "Em Teste", color: "text-cyan-300" },
}

export default function ServicesPage() {
  const { services, categories, isLoading } = useServices()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const filteredServices = useMemo(() => {
    let result = services
    if (selectedCategory) {
      result = result.filter((s) => s.categoryId === selectedCategory)
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          String(s.id).includes(searchTerm)
      )
    }
    return result
  }, [services, selectedCategory, searchTerm])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Nossos Servicos</h1>
        <p className="text-text-secondary mt-1">
          Explore todos os servicos disponiveis para impulsionar suas redes sociais.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Buscar servico por nome ou ID..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todos ({services.length})
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name} ({cat.serviceCount})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">Nenhum servico encontrado</p>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Servico</TableHead>
                  <TableHead className="hidden md:table-cell">Qualidade</TableHead>
                  <TableHead>Preco/1000</TableHead>
                  <TableHead className="hidden sm:table-cell">Min</TableHead>
                  <TableHead className="hidden sm:table-cell">Max</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((svc) => {
                  const quality = qualityConfig[(svc as any).quality || "media"] || qualityConfig.media
                  const price = (svc as any).pricePerThousand || svc.pricePerUnit * 1000
                  const refill = (svc as any).refill
                  return (
                    <TableRow key={svc.id}>
                      <TableCell className="font-mono text-xs text-text-muted">
                        {svc.id}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="text-sm text-text-primary truncate">{svc.name}</p>
                          <p className="text-xs text-text-muted">{svc.categoryName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="flex items-center gap-1 text-sm">
                          <span>{quality.emoji}</span>
                          <span className={quality.color}>{quality.label}</span>
                          {refill && <span className="ml-1">♻️</span>}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-accent-primary">
                        {formatCurrency(price)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-text-secondary text-sm">
                        {svc.minQuantity.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-text-secondary text-sm">
                        {svc.maxQuantity.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {(svc as any).type || "DEFAULT"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/new-order?serviceId=${svc.id}`}>
                          <Button size="sm" variant="secondary">
                            <ShoppingCart className="h-3 w-3" />
                            Pedir
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((svc) => {
            const quality = qualityConfig[(svc as any).quality || "media"] || qualityConfig.media
            const price = (svc as any).pricePerThousand || svc.pricePerUnit * 1000
            const refill = (svc as any).refill
            return (
              <Card key={svc.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-muted font-mono">#{svc.id}</p>
                      <CardTitle className="text-sm mt-1 line-clamp-2">{svc.name}</CardTitle>
                    </div>
                    <span className="text-lg ml-2">{quality.emoji}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{svc.categoryName}</Badge>
                      {refill && (
                        <Badge variant="success" className="text-xs">♻️ Garantia</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                      <div>
                        <span className="text-text-muted">Min:</span>{" "}
                        {svc.minQuantity.toLocaleString("pt-BR")}
                      </div>
                      <div>
                        <span className="text-text-muted">Max:</span>{" "}
                        {svc.maxQuantity.toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-glass-border">
                    <span className="text-lg font-bold text-accent-primary">
                      {formatCurrency(price)}
                      <span className="text-xs text-text-muted font-normal">/1000</span>
                    </span>
                    <Link href={`/new-order?serviceId=${svc.id}`}>
                      <Button size="sm">
                        <ShoppingCart className="h-3 w-3" />
                        Pedir
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-sm text-text-muted text-center">
        {filteredServices.length} servicos encontrados
      </p>
    </div>
  )
}
