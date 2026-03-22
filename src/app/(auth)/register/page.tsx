"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import { Mail, Lock, User, UserPlus, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-bg-primary"><div className="text-text-secondary">Carregando...</div></div>}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const refCode = searchParams.get("ref")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Save referral code to cookie
  useEffect(() => {
    if (refCode) {
      document.cookie = `ref=${encodeURIComponent(refCode)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    }
  }, [refCode])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ref: refCode || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Erro ao criar conta. Tente novamente.")
        return
      }

      toast.success("Conta criada com sucesso! Fazendo login...")

      // Auto-login after registration
      const signInResult = await signIn("credentials", {
        login: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push("/new-order")
      } else {
        router.push("/login")
      }
    } catch {
      toast.error("Erro de conexao. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleRegister() {
    setIsGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/new-order" })
    } catch {
      toast.error("Erro ao iniciar cadastro com Google.")
      setIsGoogleLoading(false)
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
              Crie sua conta e comece a impulsionar suas redes
            </p>
          </div>

          {/* Register form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  className="pl-10"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-accent-danger">{errors.name.message}</p>
              )}
            </div>

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
                <p className="text-xs text-accent-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuario</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                <Input
                  id="username"
                  type="text"
                  placeholder="seu_usuario"
                  className="pl-10"
                  {...register("username")}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-accent-danger">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  className="pl-10"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-accent-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-secondary px-2 text-text-muted">ou</span>
            </div>
          </div>

          {/* Google register */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            loading={isGoogleLoading}
            onClick={handleGoogleRegister}
          >
            <Chrome className="h-4 w-4" />
            Cadastrar com Google
          </Button>

          {/* Login link */}
          <p className="text-center text-sm text-text-secondary">
            Ja tem conta?{" "}
            <Link
              href="/login"
              className="text-accent-primary hover:text-accent-secondary font-medium transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
