"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Users,
  DollarSign,
  Copy,
  Check,
  Gift,
  TrendingUp,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { formatCurrency, formatDate } from "@/lib/utils"

interface AffiliateData {
  affiliateCode: string
  totalReferrals: number
  totalEarned: number
  pendingEarnings: number
  referrals: Array<{
    id: number
    username: string
    joinedAt: string
  }>
  earnings: Array<{
    id: number
    referredUser: string
    amount: number
    percentage: number
    status: string
    createdAt: string
  }>
}

export default function AffiliatesPage() {
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["affiliates"],
    queryFn: async () => {
      const res = await fetch("/api/affiliates")
      if (!res.ok) throw new Error("Failed to fetch affiliate data")
      const json = await res.json()
      return json.data as AffiliateData
    },
    staleTime: 60000,
  })

  const referralLink = data
    ? `https://brasilfollow.com/register?ref=${data.affiliateCode}`
    : ""

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success("Link copiado!")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Erro ao copiar")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Programa de Afiliados</h1>
        <p className="text-text-secondary mt-1">
          Ganhe 3% de comissao sobre cada compra dos seus indicados!
        </p>
      </div>

      {/* Referral Link */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary mb-1">Seu link de indicacao:</p>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-glass-border bg-glass-bg px-4 py-2.5 text-sm font-mono text-accent-primary truncate flex-1">
                    {referralLink}
                  </div>
                  <Button
                    variant={copied ? "secondary" : "default"}
                    size="sm"
                    onClick={copyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Indicados</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {data?.totalReferrals || 0}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Ganhos Totais</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-accent-success mt-1">
                    {formatCurrency(data?.totalEarned || 0)}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent-success/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-accent-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Ganhos Pendentes</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-accent-warning mt-1">
                    {formatCurrency(data?.pendingEarnings || 0)}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent-warning/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-accent-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent-primary" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-glass-border bg-glass-bg p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-accent-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-accent-primary font-bold">1</span>
              </div>
              <p className="text-sm text-text-primary font-medium">Compartilhe seu Link</p>
              <p className="text-xs text-text-secondary mt-1">
                Envie seu link de indicacao para amigos e clientes
              </p>
            </div>
            <div className="rounded-lg border border-glass-border bg-glass-bg p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-accent-secondary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-accent-secondary font-bold">2</span>
              </div>
              <p className="text-sm text-text-primary font-medium">Eles se Cadastram</p>
              <p className="text-xs text-text-secondary mt-1">
                Quando eles criam uma conta usando seu link
              </p>
            </div>
            <div className="rounded-lg border border-glass-border bg-glass-bg p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-accent-success/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-accent-success font-bold">3</span>
              </div>
              <p className="text-sm text-text-primary font-medium">Voce Ganha!</p>
              <p className="text-xs text-text-secondary mt-1">
                3% de comissao em cada compra que eles fazem
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Usuarios Indicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !data?.referrals.length ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Nenhum indicado ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.referrals.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-mono text-sm">{ref.username}</TableCell>
                      <TableCell className="text-text-secondary text-xs">
                        {formatDate(ref.joinedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Historico de Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !data?.earnings.length ? (
              <div className="text-center py-8">
                <DollarSign className="h-10 w-10 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Nenhum ganho ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="font-mono text-sm">
                        {earning.referredUser}
                      </TableCell>
                      <TableCell className="text-accent-success font-semibold">
                        {formatCurrency(earning.amount)}
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm">
                        {earning.percentage}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={earning.status === "APPROVED" ? "success" : "warning"}
                        >
                          {earning.status === "APPROVED" ? "Aprovado" : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
