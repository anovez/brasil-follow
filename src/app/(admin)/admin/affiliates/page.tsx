"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Users,
  DollarSign,
  CheckCircle,
} from "lucide-react"

interface AffiliateData {
  userId: number
  name: string
  email: string
  username: string
  affiliateCode: string
  totalReferrals: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([])
  const [loading, setLoading] = useState(true)
  const [affiliateEnabled, setAffiliateEnabled] = useState(true)
  const [toggling, setToggling] = useState(false)

  const [payOpen, setPayOpen] = useState(false)
  const [payAffiliateId, setPayAffiliateId] = useState<number | null>(null)
  const [payName, setPayName] = useState("")
  const [payAmount, setPayAmount] = useState(0)
  const [payLoading, setPayLoading] = useState(false)

  async function fetchAffiliates() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/affiliates")
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setAffiliates(data.affiliates)
      setAffiliateEnabled(data.affiliateEnabled)
    } catch {
      setAffiliates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAffiliates()
  }, [])

  async function handleToggleProgram() {
    setToggling(true)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-program", enabled: !affiliateEnabled }),
      })
      if (!res.ok) throw new Error("Erro")
      setAffiliateEnabled(!affiliateEnabled)
    } catch {
      alert("Erro ao alterar programa")
    } finally {
      setToggling(false)
    }
  }

  function openPayDialog(affiliate: AffiliateData) {
    setPayAffiliateId(affiliate.userId)
    setPayName(affiliate.name)
    setPayAmount(affiliate.pendingEarnings)
    setPayOpen(true)
  }

  async function handlePay() {
    if (!payAffiliateId) return
    setPayLoading(true)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-paid", affiliateId: payAffiliateId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao marcar como pago")
        return
      }
      alert(`${data.updated} ganho(s) marcado(s) como pago(s)`)
      setPayOpen(false)
      fetchAffiliates()
    } catch {
      alert("Erro ao marcar como pago")
    } finally {
      setPayLoading(false)
    }
  }

  const totalEarnings = affiliates.reduce((sum, a) => sum + a.totalEarnings, 0)
  const totalPending = affiliates.reduce((sum, a) => sum + a.pendingEarnings, 0)
  const totalReferrals = affiliates.reduce((sum, a) => sum + a.totalReferrals, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Afiliados</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-text-muted">Programa ativo</span>
          <Switch
            checked={affiliateEnabled}
            onCheckedChange={handleToggleProgram}
            disabled={toggling}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-text-muted uppercase">Total Indicados</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{totalReferrals}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent-success" />
              <p className="text-xs text-text-muted uppercase">Total Ganhos</p>
            </div>
            <p className="text-2xl font-bold text-accent-success mt-1">
              R$ {totalEarnings.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent-warning" />
              <p className="text-xs text-text-muted uppercase">Pendentes</p>
            </div>
            <p className="text-2xl font-bold text-accent-warning mt-1">
              R$ {totalPending.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : affiliates.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted">
              Nenhum afiliado encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden md:table-cell">Codigo</TableHead>
                    <TableHead className="text-center">Indicados</TableHead>
                    <TableHead className="text-right">Ganhos Totais</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Pendentes</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Pagos</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.userId}>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{affiliate.name}</p>
                          <p className="text-[10px] text-text-muted">{affiliate.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono text-text-muted">
                        {affiliate.affiliateCode}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">
                          {affiliate.totalReferrals}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-accent-success">
                        R$ {affiliate.totalEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-accent-warning hidden sm:table-cell">
                        R$ {affiliate.pendingEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-text-muted hidden sm:table-cell">
                        R$ {affiliate.paidEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {affiliate.pendingEarnings > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPayDialog(affiliate)}
                            className="text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Ganhos como Pagos</DialogTitle>
            <DialogDescription>
              Marcar todos os ganhos pendentes de <strong>{payName}</strong> como pagos.
              Valor pendente: <strong className="text-accent-success">R$ {payAmount.toFixed(2)}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
            <Button loading={payLoading} onClick={handlePay}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
