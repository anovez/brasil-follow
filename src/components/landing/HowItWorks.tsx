import { UserPlus, Wallet, ShoppingCart } from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Cadastre-se",
    description: "Crie sua conta gratuitamente em menos de 1 minuto",
    icon: UserPlus,
  },
  {
    number: 2,
    title: "Deposite via PIX",
    description: "Adicione saldo via PIX instantâneo a partir de R$ 5,00",
    icon: Wallet,
  },
  {
    number: 3,
    title: "Faça seu Pedido",
    description:
      "Escolha o serviço, insira o link e pronto! Entrega automática.",
    icon: ShoppingCart,
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Como <span className="gradient-text">Funciona</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Em apenas 3 passos simples você já pode impulsionar suas redes
            sociais
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-24 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-accent-primary via-accent-secondary to-pink-500 opacity-30" />

          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Number badge */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center relative z-10 group hover:border-accent-primary/40 transition-all duration-300 hover:scale-110">
                    <Icon className="w-8 h-8 text-accent-primary" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-sm font-bold text-white z-20">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 text-text-primary">
                  {step.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
