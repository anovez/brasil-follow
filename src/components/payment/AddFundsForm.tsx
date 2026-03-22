"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Wallet, QrCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBalance } from "@/hooks/useBalance"
import { formatCurrency } from "@/lib/utils"

const addFundsSchema = z.object({
  amount: z
    .number({ error: "Digite um valor" })
    .min(5, "Valor minimo e R$ 5,00")
    .max(10000, "Valor maximo e R$ 10.000,00"),
})

type AddFundsData = z.infer<typeof addFundsSchema>

interface AddFundsFormProps {
  onPixGenerated: (pixData: {
    paymentId: number
    amount: number
    pixCopiaECola: string
    qrCodeBase64: string
    expiresAt: string
  }) => void
}

const presetAmounts = [10, 25, 50, 100]

export function AddFundsForm({ onPixGenerated }: AddFundsFormProps) {
  const { balance } = useBalance()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddFundsData>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: undefined as unknown as number,
    },
  })

  const watchedAmount = watch("amount")

  const onSubmit = async (data: AddFundsData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/balance/add-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: data.amount }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || "Erro ao gerar PIX")
        return
      }

      toast.success("PIX gerado com sucesso!")
      onPixGenerated(json.data)
    } catch {
      toast.error("Erro de conexao. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Adicionar Saldo via PIX
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Balance */}
        <div className="rounded-lg border border-glass-border bg-glass-bg p-4 mb-6 text-center">
          <p className="text-sm text-text-secondary">Saldo Atual</p>
          <p className="text-3xl font-bold text-accent-success mt-1">
            {formatCurrency(balance)}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Preset buttons */}
          <div>
            <Label>Valor do deposito</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={watchedAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setValue("amount", amount, { shouldValidate: true })}
                >
                  R$ {amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Ou digite um valor personalizado</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={5}
                max={10000}
                placeholder="0,00"
                className="pl-10"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-accent-danger">{errors.amount.message}</p>
            )}
            <p className="text-xs text-text-muted">
              Minimo: R$ 5,00 | Maximo: R$ 10.000,00
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            <QrCode className="h-4 w-4" />
            Gerar PIX
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
