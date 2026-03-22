"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Shield, Zap, QrCode } from "lucide-react"

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = performance.now()

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))

            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString("pt-BR")}</span>
}

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center px-4">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-secondary/20 rounded-full blur-[128px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-text-secondary mb-8">
          <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
          Plataforma #1 de SMM no Brasil
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          Cresça suas redes{" "}
          <span className="gradient-text">sociais hoje</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
          Seguidores, curtidas e visualizações para Instagram, TikTok, YouTube e
          mais. Entrega automática e instantânea.
        </p>

        {/* Counter */}
        <div className="mb-10">
          <p className="text-3xl sm:text-4xl font-bold text-text-primary">
            +<AnimatedCounter target={10000} /> clientes satisfeitos
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/register"
            className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white rounded-xl bg-gradient-to-r from-accent-primary via-accent-secondary to-pink-500 shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40 transition-all duration-300 hover:scale-105 animate-pulse [animation-duration:3s]"
          >
            Começar Agora
          </Link>
          <Link
            href="#precos"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-text-primary rounded-xl border border-glass-border hover:border-accent-primary/50 hover:bg-glass-bg transition-all duration-300"
          >
            Ver Preços
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-text-secondary text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-success" />
            <span>Pagamento Seguro via PIX</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent-warning" />
            <span>Entrega Automática</span>
          </div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-accent-primary" />
            <span>PIX Instantâneo</span>
          </div>
        </div>
      </div>
    </section>
  )
}
