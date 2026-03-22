"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { AddFundsForm } from "@/components/payment/AddFundsForm"
import { PixQRCode } from "@/components/payment/PixQRCode"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useBalance } from "@/hooks/useBalance"

interface PixData {
  paymentId: number
  amount: number
  pixCopiaECola: string
  qrCodeBase64: string
  expiresAt: string
}

interface DepositHistoryItem {
  id: number
  amount: number
  method: string
  status: string
  createdAt: string
  paidAt: string | null
}

const depositStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "secondary"; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pendente",
    variant: "warning",
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Aprovado",
    variant: "success",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Rejeitado",
    variant: "danger",
    icon: <XCircle className="h-3 w-3" />,
  },
  EXPIRED: {
    label: "Expirado",
    variant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  REFUNDED: {
    label: "Reembolsado",
    variant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

export default function AddFundsPage() {
  const [pixData, setPixData] = useState<PixData | null>(null)
  const { refetch: refetchBalance } = useBalance()

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["deposit-history"],
    queryFn: async () => {
      const res = await fetch("/api/balance/history?limit=20")
      if (!res.ok) throw new Error("Failed to fetch history")
      const json = await res.json()
      return json.data as { items: DepositHistoryItem[]; total: number }
    },
    staleTime: 30000,
  })

  const deposits = historyData?.items || []

  const handlePixGenerated = (data: PixData) => {
    setPixData(data)
  }

  const handlePaymentConfirmed = () => {
    refetchBalance()
    refetchHistory()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Adicionar Saldo</h1>
        <p className="text-text-secondary mt-1">
          Adicione saldo via PIX para comprar servicos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form or QR Code */}
        <div>
          {pixData ? (
            <div className="space-y-4">
              <PixQRCode
                pixData={pixData}
                onPaymentConfirmed={handlePaymentConfirmed}
              />
              <button
                onClick={() => setPixData(null)}
                className="text-sm text-text-muted hover:text-text-primary transition-colors w-full text-center"
              >
                Gerar novo PIX
              </button>
            </div>
          ) : (
            <AddFundsForm onPixGenerated={handlePixGenerated} />
          )}
        </div>

        {/* Deposit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Historico de Depositos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">Nenhum deposito encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit) => {
                    const config = depositStatusConfig[deposit.status] || depositStatusConfig.PENDING
                    return (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-semibold">
                          {formatCurrency(deposit.amount)}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {deposit.method}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-text-secondary text-xs">
                          {formatDate(deposit.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
