"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Lock, LogIn, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const loginSchema = z.object({
  login: z.string().min(1, "E-mail ou usuario e obrigatorio"),
  password: z.string().min(1, "Senha e obrigatoria"),
})

type LoginFormData = z.infer<typeof loginSchema>

function getErrorMessage(error: string | null): string | null {
  if (!error) return null
  switch (error) {
    case "CredentialsSignin":
      return "E-mail/usuario ou senha incorretos."
    case "banned":
      return "Sua conta foi banida. Entre em contato com o suporte para mais informacoes."
    case "OAuthAccountNotLinked":
      return "Este e-mail ja esta vinculado a outra conta. Faca login com o metodo original."
    case "OAuthSignin":
    case "OAuthCallback":
      return "Erro ao autenticar com o provedor. Tente novamente."
    default:
      return "Ocorreu um erro ao fazer login. Tente novamente."
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-bg-primary"><div className="text-text-secondary">Carregando...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const errorMessage = getErrorMessage(errorParam) || formError

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setFormError(null)

    try {
      const result = await signIn("credentials", {
        login: data.login,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setFormError("E-mail/usuario ou senha incorretos.")
        } else {
          setFormError("Ocorreu um erro ao fazer login. Tente novamente.")
        }
      } else if (result?.ok) {
        window.location.href = "/new-order"
      }
    } catch {
      setFormError("Erro de conexao. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/new-order" })
    } catch {
      setFormError("Erro ao iniciar login com Google.")
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
              Acesse sua conta para gerenciar seus pedidos
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-sm">
              {errorMessage}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">E-mail ou Usuario</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="login"
                  type="text"
                  placeholder="seu@email.com ou usuario"
                  className="pl-10"
                  {...register("login")}
                />
              </div>
              {errors.login && (
                <p className="text-xs text-accent-danger">{errors.login.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent-primary hover:text-accent-secondary transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
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

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              <LogIn className="h-4 w-4" />
              Entrar
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

          {/* Google login */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            loading={isGoogleLoading}
            onClick={handleGoogleLogin}
          >
            <Chrome className="h-4 w-4" />
            Entrar com Google
          </Button>

          {/* Register link */}
          <p className="text-center text-sm text-text-secondary">
            Nao tem conta?{" "}
            <Link
              href="/register"
              className="text-accent-primary hover:text-accent-secondary font-medium transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
