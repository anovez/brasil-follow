import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Video,
  Send,
  Music,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

const services = [
  {
    network: "Instagram",
    type: "Seguidores",
    price: "R$ 5,84",
    icon: Instagram,
    color: "#E1306C",
    popular: true,
  },
  {
    network: "Instagram",
    type: "Curtidas",
    price: "R$ 2,50",
    icon: Instagram,
    color: "#E1306C",
    popular: false,
  },
  {
    network: "TikTok",
    type: "Seguidores",
    price: "R$ 4,00",
    icon: Video,
    color: "#00f2ea",
    popular: false,
  },
  {
    network: "TikTok",
    type: "Curtidas",
    price: "R$ 1,80",
    icon: Video,
    color: "#00f2ea",
    popular: false,
  },
  {
    network: "YouTube",
    type: "Inscritos",
    price: "R$ 15,00",
    icon: Youtube,
    color: "#FF0000",
    popular: false,
  },
  {
    network: "YouTube",
    type: "Visualizações",
    price: "R$ 3,00",
    icon: Youtube,
    color: "#FF0000",
    popular: false,
  },
  {
    network: "Twitter/X",
    type: "Seguidores",
    price: "R$ 6,00",
    icon: Twitter,
    color: "#1DA1F2",
    popular: false,
  },
  {
    network: "Facebook",
    type: "Curtidas na Página",
    price: "R$ 8,00",
    icon: Facebook,
    color: "#1877F2",
    popular: false,
  },
]

export function PricingTable() {
  return (
    <section id="precos" className="py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Nossos <span className="gradient-text">Preços</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Os melhores preços do mercado com entrega automática e garantia de
            qualidade
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={`${service.network}-${service.type}`}
                className="relative glass-card p-6 hover:border-accent-primary/40 transition-all duration-300 hover:scale-[1.03] group"
              >
                {/* Popular badge */}
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-accent-warning to-orange-500 text-xs font-bold text-white whitespace-nowrap">
                    Mais Vendido
                  </div>
                )}

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${service.color}15` }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: service.color }}
                  />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-text-primary mb-1">
                  {service.network}
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  {service.type}
                </p>

                {/* Price */}
                <div className="text-text-primary">
                  <span className="text-xs text-text-muted">A partir de</span>
                  <p className="text-xl font-bold gradient-text">
                    {service.price}
                    <span className="text-xs text-text-muted font-normal">
                      /1000
                    </span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-accent-primary/50 text-accent-primary hover:bg-accent-primary/10 transition-all duration-300 font-medium"
          >
            Ver todos os serviços
            <span className="text-lg">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
