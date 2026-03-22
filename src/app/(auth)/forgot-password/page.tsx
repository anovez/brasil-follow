"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations"
import { Mail, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true)

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch {
      // Silently fail - don't reveal if email exists
    } finally {
      setIsLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold gradient-text">Brasil Follow</h1>
            <p className="text-sm text-text-secondary">
              Recupere o acesso a sua conta
            </p>
          </div>

          {submitted ? (
            /* Success state */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent-success/10 border border-accent-success/20 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-accent-success/20 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-accent-success" />
                  </div>
                </div>
                <p className="text-sm text-accent-success font-medium">
                  E-mail enviado!
                </p>
                <p className="text-xs text-text-secondary">
                  Se o e-mail estiver cadastrado, voce recebera um link de
                  recuperacao de senha em alguns minutos. Verifique tambem sua
                  caixa de spam.
                </p>
              </div>

              <Link href="/login" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Button>
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-accent-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                <Send className="h-4 w-4" />
                Enviar link de recuperacao
              </Button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
