"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Copy, Check, Clock, Zap, PartyPopper } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PixData {
  paymentId: number
  amount: number
  pixCopiaECola: string
  qrCodeBase64: string
  expiresAt: string
}

interface PixQRCodeProps {
  pixData: PixData
  onPaymentConfirmed?: () => void
}

export function PixQRCode({ pixData, onPaymentConfirmed }: PixQRCodeProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState("")
  const [expired, setExpired] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const expiresMs = new Date(pixData.expiresAt).getTime()
      const diff = expiresMs - now

      if (diff <= 0) {
        setExpired(true)
        setTimeLeft("00:00")
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [pixData.expiresAt])

  // Poll for payment status
  const { data: paymentStatus } = useQuery({
    queryKey: ["payment-status", pixData.paymentId],
    queryFn: async () => {
      const res = await fetch(`/api/balance/check-payment?id=${pixData.paymentId}`)
      if (!res.ok) throw new Error("Failed to check payment")
      const json = await res.json()
      return json.data as { status: string; amount?: number; paidAt?: string }
    },
    refetchInterval: confirmed || expired ? false : 5000,
    enabled: !confirmed && !expired,
  })

  // Handle confirmed payment
  useEffect(() => {
    if (paymentStatus?.status === "APPROVED" && !confirmed) {
      setConfirmed(true)
      setShowConfetti(true)
      toast.success("Pagamento confirmado!", {
        description: `R$ ${pixData.amount.toFixed(2)} adicionado ao seu saldo.`,
      })
      onPaymentConfirmed?.()

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    }
  }, [paymentStatus, confirmed, pixData.amount, router, onPaymentConfirmed])

  const copyPixCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixData.pixCopiaECola)
      setCopied(true)
      toast.success("Copiado!")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Erro ao copiar. Selecione e copie manualmente.")
    }
  }, [pixData.pixCopiaECola])

  if (confirmed) {
    return (
      <Card>
        <CardContent className="p-8 text-center relative overflow-hidden">
          {/* Confetti effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ["#6c5ce7", "#a855f7", "#10b981", "#f59e0b", "#ec4899"][
                        Math.floor(Math.random() * 5)
                      ],
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="relative z-10">
            <div className="h-20 w-20 rounded-full bg-accent-success/20 flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="h-10 w-10 text-accent-success" />
            </div>
            <h3 className="text-xl font-bold text-accent-success mb-2">
              Pagamento Confirmado!
            </h3>
            <p className="text-text-secondary">
              R$ {pixData.amount.toFixed(2)} foram adicionados ao seu saldo.
            </p>
            <p className="text-sm text-text-muted mt-2">
              Redirecionando para o painel em instantes...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (expired) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-accent-danger/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-accent-danger" />
          </div>
          <h3 className="text-lg font-bold text-accent-danger mb-2">
            PIX Expirado
          </h3>
          <p className="text-text-secondary">
            O tempo para pagamento expirou. Gere um novo PIX.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Timer */}
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4 text-accent-warning" />
          <span className="text-sm text-text-secondary">Expira em:</span>
          <span className="text-lg font-mono font-bold text-accent-warning">{timeLeft}</span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <img
              src={pixData.qrCodeBase64}
              alt="QR Code PIX"
              className="w-48 h-48 sm:w-56 sm:h-56"
            />
          </div>
        </div>

        {/* Copy button */}
        <div className="space-y-3">
          <p className="text-sm text-text-secondary text-center">
            Escaneie o QR Code ou copie o codigo PIX abaixo:
          </p>
          <div className="relative">
            <div className="rounded-lg border border-glass-border bg-glass-bg p-3 pr-12 text-xs font-mono text-text-secondary break-all max-h-20 overflow-y-auto">
              {pixData.pixCopiaECola}
            </div>
            <Button
              size="sm"
              variant={copied ? "secondary" : "default"}
              className="absolute right-2 top-2"
              onClick={copyPixCode}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <div className="h-2 w-2 rounded-full bg-accent-warning animate-pulse" />
          Aguardando pagamento...
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted border-t border-glass-border pt-4">
          <Zap className="h-3 w-3 text-accent-warning" />
          327 depositos nas ultimas 24h
        </div>
      </CardContent>
    </Card>
  )
}
