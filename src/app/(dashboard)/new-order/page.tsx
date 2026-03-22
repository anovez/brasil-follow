"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Send,
  Link as LinkIcon,
  Hash,
  DollarSign,
  Info,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Music2,
  MessageCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectOption } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useServices } from "@/hooks/useServices"
import { useBalance } from "@/hooks/useBalance"
import { formatCurrency, calculateLevelDiscount } from "@/lib/utils"

const orderFormSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria"),
  serviceId: z.string().min(1, "Selecione um servico"),
  link: z.string().url("URL invalida"),
  quantity: z.number({ error: "Digite uma quantidade" }).int().min(1, "Quantidade minima e 1"),
})

type OrderFormData = z.infer<typeof orderFormSchema>

const qualityEmojis: Record<string, string> = {
  premium: "👑",
  alta: "🏆",
  media: "🥈",
  baixa: "🥉",
  teste: "💎",
}

function detectSocialIcon(url: string) {
  if (!url) return null
  const lower = url.toLowerCase()
  if (lower.includes("instagram.com")) return <Instagram className="h-5 w-5 text-pink-400" />
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return <Youtube className="h-5 w-5 text-red-500" />
  if (lower.includes("facebook.com") || lower.includes("fb.com")) return <Facebook className="h-5 w-5 text-blue-500" />
  if (lower.includes("twitter.com") || lower.includes("x.com")) return <Twitter className="h-5 w-5 text-sky-400" />
  if (lower.includes("tiktok.com")) return <Music2 className="h-5 w-5 text-text-primary" />
  if (lower.includes("t.me") || lower.includes("telegram")) return <MessageCircle className="h-5 w-5 text-blue-400" />
  if (lower.includes("spotify.com")) return <Music2 className="h-5 w-5 text-green-400" />
  return <LinkIcon className="h-5 w-5 text-text-muted" />
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="text-text-secondary p-8">Carregando...</div>}>
      <NewOrderForm />
    </Suspense>
  )
}

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedService = searchParams.get("serviceId")

  const { services, categories, isLoading: servicesLoading } = useServices()
  const { balance, refetch: refetchBalance } = useBalance()

  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      categoryId: "",
      serviceId: "",
      link: "",
      quantity: undefined as unknown as number,
    },
  })

  const watchedServiceId = watch("serviceId")
  const watchedLink = watch("link")
  const watchedQuantity = watch("quantity")

  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) return services
    return services.filter((s) => String(s.categoryId) === selectedCategoryId)
  }, [services, selectedCategoryId])

  const selectedService = useMemo(() => {
    if (!watchedServiceId) return null
    return services.find((s) => String(s.id) === watchedServiceId) || null
  }, [services, watchedServiceId])

  // Pre-select service from URL params
  useEffect(() => {
    if (preSelectedService && services.length > 0) {
      const svc = services.find((s) => String(s.id) === preSelectedService)
      if (svc) {
        setSelectedCategoryId(String(svc.categoryId))
        setValue("categoryId", String(svc.categoryId))
        setValue("serviceId", preSelectedService)
      }
    }
  }, [preSelectedService, services, setValue])

  // Calculate price
  const calculatedPrice = useMemo(() => {
    if (!selectedService || !watchedQuantity) return 0
    const base = (watchedQuantity / 1000) * selectedService.pricePerUnit
    return Math.max(0, base)
  }, [selectedService, watchedQuantity])

  // We need to use pricePerThousand from the hook data
  const calculatedPriceFromService = useMemo(() => {
    if (!selectedService || !watchedQuantity) return 0
    // The hook returns pricePerUnit but the API returns pricePerThousand
    // Let's calculate using what we have
    const pricePerThousand = (selectedService as any).pricePerThousand || selectedService.pricePerUnit * 1000
    return (watchedQuantity / 1000) * pricePerThousand
  }, [selectedService, watchedQuantity])

  const levelDiscount = calculateLevelDiscount("BRONZE") // Will be fetched from session in real usage
  const discountAmount = calculatedPriceFromService * (levelDiscount / 100)
  const finalPrice = Math.max(0, calculatedPriceFromService - discountAmount)

  const socialIcon = detectSocialIcon(watchedLink || "")

  const onSubmit = () => {
    setConfirmDialogOpen(true)
  }

  const confirmOrder = async () => {
    if (!selectedService) return
    setSubmitting(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: Number(watchedServiceId),
          link: watchedLink,
          quantity: Number(watchedQuantity),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar pedido")
        return
      }

      toast.success("Pedido criado com sucesso!", {
        description: `Pedido #${data.data?.id || data.id} foi enviado para processamento.`,
      })
      refetchBalance()
      router.push("/orders")
    } catch {
      toast.error("Erro de conexao. Tente novamente.")
    } finally {
      setSubmitting(false)
      setConfirmDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Novo Pedido</h1>
        <p className="text-text-secondary mt-1">
          Selecione o servico e preencha os dados abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {servicesLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      id="category"
                      value={selectedCategoryId}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedCategoryId(val)
                        setValue("categoryId", val)
                        setValue("serviceId", "")
                      }}
                    >
                      <SelectOption value="">Selecione uma categoria</SelectOption>
                      {categories.map((cat) => (
                        <SelectOption key={cat.id} value={String(cat.id)}>
                          {cat.name} ({cat.serviceCount} servicos)
                        </SelectOption>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <p className="text-xs text-accent-danger">{errors.categoryId.message}</p>
                    )}
                  </div>

                  {/* Service */}
                  <div className="space-y-2">
                    <Label htmlFor="service">Servico</Label>
                    <Select
                      id="service"
                      {...register("serviceId")}
                      disabled={!selectedCategoryId}
                    >
                      <SelectOption value="">Selecione um servico</SelectOption>
                      {filteredServices.map((svc) => {
                        const emoji = qualityEmojis[svc.description?.includes("premium") ? "premium" : (svc as any).quality || "media"] || "🥈"
                        const price = (svc as any).pricePerThousand || svc.pricePerUnit * 1000
                        return (
                          <SelectOption key={svc.id} value={String(svc.id)}>
                            [{svc.id}] {emoji} {svc.name} - {formatCurrency(price)}/1000
                          </SelectOption>
                        )
                      })}
                    </Select>
                    {errors.serviceId && (
                      <p className="text-xs text-accent-danger">{errors.serviceId.message}</p>
                    )}
                  </div>

                  {/* Link */}
                  <div className="space-y-2">
                    <Label htmlFor="link">Link</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        {socialIcon}
                      </div>
                      <Input
                        id="link"
                        placeholder="https://instagram.com/seu_perfil"
                        className="pl-10"
                        {...register("link")}
                      />
                    </div>
                    {errors.link && (
                      <p className="text-xs text-accent-danger">{errors.link.message}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Hash className="h-4 w-4 text-text-muted" />
                        </div>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder={
                            selectedService
                              ? `Min: ${selectedService.minQuantity} / Max: ${selectedService.maxQuantity}`
                              : "Quantidade"
                          }
                          className="pl-10"
                          min={selectedService?.minQuantity || 1}
                          max={selectedService?.maxQuantity || 10000000}
                          {...register("quantity", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    {selectedService && (
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>Min: {selectedService.minQuantity.toLocaleString("pt-BR")}</span>
                        <span>Max: {selectedService.maxQuantity.toLocaleString("pt-BR")}</span>
                      </div>
                    )}
                    {selectedService && watchedQuantity > 0 && (
                      <input
                        type="range"
                        min={selectedService.minQuantity}
                        max={Math.min(selectedService.maxQuantity, 100000)}
                        value={watchedQuantity || selectedService.minQuantity}
                        onChange={(e) => setValue("quantity", Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-glass-bg accent-accent-primary"
                      />
                    )}
                    {errors.quantity && (
                      <p className="text-xs text-accent-danger">{errors.quantity.message}</p>
                    )}
                  </div>

                  {/* Price Summary */}
                  {selectedService && watchedQuantity > 0 && (
                    <div className="rounded-lg border border-glass-border bg-glass-bg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Valor base:</span>
                        <span className="text-text-primary">{formatCurrency(calculatedPriceFromService)}</span>
                      </div>
                      {levelDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-accent-success">Desconto ({levelDiscount}%):</span>
                          <span className="text-accent-success">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="border-t border-glass-border pt-2 flex justify-between">
                        <span className="text-text-primary font-semibold">Total:</span>
                        <span className="text-xl font-bold text-accent-primary">
                          {formatCurrency(finalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>Seu saldo:</span>
                        <span className={balance >= finalPrice ? "text-accent-success" : "text-accent-danger"}>
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!selectedService || !watchedQuantity || balance < finalPrice}
                  >
                    <Send className="h-4 w-4" />
                    Enviar Pedido
                  </Button>

                  {balance < finalPrice && finalPrice > 0 && (
                    <p className="text-xs text-accent-danger text-center">
                      Saldo insuficiente.{" "}
                      <a href="/add-funds" className="text-accent-primary underline">
                        Adicione saldo
                      </a>{" "}
                      para continuar.
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel - Legend */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Legenda de Qualidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Qualidade</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>👑</span> <span>Premium - Melhor qualidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>🏆</span> <span>Alta - Otima qualidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>🥈</span> <span>Media - Boa qualidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>🥉</span> <span>Baixa - Qualidade basica</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>💎</span> <span>Em Teste - Novo servico</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-glass-border pt-3 space-y-2">
                <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Entrega</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>⚡</span> <span>Rapido - Ate 1h</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>❄️</span> <span>Lento - Ate 24h</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-glass-border pt-3 space-y-2">
                <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Garantia</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>♻️</span> <span>Com garantia de reposicao</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>❌</span> <span>Sem garantia</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Service Info */}
          {selectedService && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes do Servico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">ID:</span>
                  <span className="text-text-primary font-mono">{selectedService.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Preco/1000:</span>
                  <span className="text-text-primary">
                    {formatCurrency((selectedService as any).pricePerThousand || selectedService.pricePerUnit * 1000)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Min:</span>
                  <span className="text-text-primary">{selectedService.minQuantity.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Max:</span>
                  <span className="text-text-primary">{selectedService.maxQuantity.toLocaleString("pt-BR")}</span>
                </div>
                {selectedService.description && (
                  <p className="text-xs text-text-muted mt-2 border-t border-glass-border pt-2">
                    {selectedService.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pedido</DialogTitle>
            <DialogDescription>
              Revise os detalhes do seu pedido antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-3 my-4">
              <div className="rounded-lg border border-glass-border bg-glass-bg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Servico:</span>
                  <span className="text-text-primary text-right max-w-[200px] truncate">
                    {selectedService.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Link:</span>
                  <span className="text-text-primary text-right max-w-[200px] truncate">
                    {watchedLink}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Quantidade:</span>
                  <span className="text-text-primary">
                    {watchedQuantity?.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="border-t border-glass-border pt-2 flex justify-between">
                  <span className="text-text-primary font-semibold">Total:</span>
                  <span className="text-lg font-bold text-accent-primary">
                    {formatCurrency(finalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Cancelar
            </DialogClose>
            <Button onClick={confirmOrder} loading={submitting}>
              <Send className="h-4 w-4" />
              Confirmar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
