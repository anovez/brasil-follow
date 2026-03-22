"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Maria Eduarda",
    city: "São Paulo, SP",
    stars: 5,
    text: "Comprei 5.000 seguidores para minha loja no Instagram e recebi tudo em menos de 2 horas. Os seguidores parecem reais e o engajamento melhorou bastante. Super recomendo!",
    avatar: "ME",
  },
  {
    name: "João Pedro",
    city: "Rio de Janeiro, RJ",
    stars: 5,
    text: "Uso o Brasil Follow há 6 meses para meus clientes de social media. Os preços são imbatíveis e nunca tive problema com reposição. Atendimento nota 10!",
    avatar: "JP",
  },
  {
    name: "Ana Carolina",
    city: "Belo Horizonte, MG",
    stars: 5,
    text: "Precisava de visualizações pro meu TikTok e achei aqui o melhor custo-benefício. O pagamento via PIX foi instantâneo e a entrega começou em minutos.",
    avatar: "AC",
  },
  {
    name: "Lucas Oliveira",
    city: "Curitiba, PR",
    stars: 4,
    text: "Ótima plataforma! Comprei curtidas para minhas fotos do Instagram e todas foram entregues rápido. O painel é fácil de usar e o suporte responde super rápido.",
    avatar: "LO",
  },
  {
    name: "Beatriz Santos",
    city: "Salvador, BA",
    stars: 5,
    text: "Melhor painel SMM que já usei! Os inscritos do YouTube chegaram certinho e não perdi nenhum. O programa de afiliados também é excelente, já indiquei pra vários amigos.",
    avatar: "BS",
  },
  {
    name: "Rafael Costa",
    city: "Fortaleza, CE",
    stars: 5,
    text: "Sou revendedor e compro serviços aqui desde o começo. Preços de atacado são muito bons e a API funciona perfeitamente com meu painel. Parceria de sucesso!",
    avatar: "RC",
  },
]

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-20 sm:py-28 px-4 bg-bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            O que nossos clientes{" "}
            <span className="gradient-text">dizem</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Milhares de clientes satisfeitos em todo o Brasil
          </p>
        </div>

        {/* Testimonials carousel */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 px-4"
              >
                <div className="glass-card p-8 max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-sm font-bold text-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-text-muted">
                        {testimonial.city}
                      </p>
                    </div>
                    {/* Stars */}
                    <div className="ml-auto flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.stars
                              ? "text-accent-warning fill-accent-warning"
                              : "text-text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-text-secondary leading-relaxed italic">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "bg-accent-primary w-8"
                  : "bg-text-muted/30 hover:bg-text-muted/50"
              }`}
              aria-label={`Ir para depoimento ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
