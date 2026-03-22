"use client"

import Link from "next/link"
import {
  DollarSign,
  Users,
  Rocket,
  Code,
  TrendingUp,
  Shield,
  Zap,
  MessageSquare,
  Target,
  BarChart3,
  Star,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const steps = [
  {
    step: 1,
    title: "Crie sua Conta",
    description: "Registre-se gratuitamente na plataforma Brasil Follow. Em menos de 1 minuto voce ja tem acesso.",
    icon: <Users className="h-6 w-6" />,
    color: "bg-accent-primary/20 text-accent-primary",
  },
  {
    step: 2,
    title: "Adicione Saldo",
    description: "Adicione saldo via PIX de forma instantanea. Quanto mais saldo, mais voce economiza com nosso sistema de niveis.",
    icon: <DollarSign className="h-6 w-6" />,
    color: "bg-accent-success/20 text-accent-success",
  },
  {
    step: 3,
    title: "Conecte via API",
    description: "Use nossa API para integrar com seu proprio painel SMM. Documentacao completa e suporte tecnico incluso.",
    icon: <Code className="h-6 w-6" />,
    color: "bg-accent-secondary/20 text-accent-secondary",
  },
  {
    step: 4,
    title: "Defina seus Precos",
    description: "Coloque seu markup sobre nossos precos. Voce decide quanto cobrar dos seus clientes.",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "bg-accent-warning/20 text-accent-warning",
  },
  {
    step: 5,
    title: "Comece a Vender!",
    description: "Divulgue seus servicos e comece a receber pedidos. A entrega e automatica via nossa API.",
    icon: <Rocket className="h-6 w-6" />,
    color: "bg-pink-500/20 text-pink-400",
  },
]

const tips = [
  {
    title: "Crie um Site Profissional",
    description: "Tenha um site proprio com dominio personalizado. Isso passa mais credibilidade para seus clientes.",
    icon: <Target className="h-5 w-5 text-accent-primary" />,
  },
  {
    title: "Diversifique os Servicos",
    description: "Oferte servicos para varias redes sociais. Quanto mais opcoes, mais clientes voce atrai.",
    icon: <Star className="h-5 w-5 text-accent-warning" />,
  },
  {
    title: "Atendimento Rapido",
    description: "Responda seus clientes rapidamente. Um bom atendimento fideliza e gera indicacoes.",
    icon: <MessageSquare className="h-5 w-5 text-accent-success" />,
  },
  {
    title: "Marketing Digital",
    description: "Invista em anuncios no Google e redes sociais. Muitos revendedores faturam alto com trafego pago.",
    icon: <TrendingUp className="h-5 w-5 text-accent-secondary" />,
  },
  {
    title: "Precos Competitivos",
    description: "Pesquise a concorrencia e defina precos que sejam atraentes mas que ainda gerem lucro.",
    icon: <DollarSign className="h-5 w-5 text-pink-400" />,
  },
  {
    title: "Garantia e Confianca",
    description: "Oferca garantia de reposicao nos servicos que possuem essa opcao. Isso aumenta a confianca.",
    icon: <Shield className="h-5 w-5 text-cyan-400" />,
  },
]

export default function BeResellerPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-xl border border-glass-border bg-glass-bg backdrop-blur-md p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-accent-gradient opacity-5" />
        <div className="relative z-10">
          <div className="text-4xl mb-4">💰</div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">
            Ganhe Dinheiro Revendendo Seguidores e Curtidas
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Torne-se um revendedor da Brasil Follow e tenha seu proprio negocio de
            marketing digital. Sem investimento inicial alto, sem estoque, sem
            complicacao.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Zap className="h-4 w-4 text-accent-warning" />
              Entrega automatica
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Shield className="h-4 w-4 text-accent-success" />
              API completa
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <DollarSign className="h-4 w-4 text-accent-primary" />
              Lucro garantido
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
          Como Comecar em 5 Passos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step) => (
            <Card key={step.step} className="text-center">
              <CardContent className="p-6">
                <div
                  className={`h-14 w-14 rounded-xl ${step.color} flex items-center justify-center mx-auto mb-3`}
                >
                  {step.icon}
                </div>
                <div className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">
                  Passo {step.step}
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-text-secondary">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Profit Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-success" />
            Exemplo de Lucro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-glass-border bg-glass-bg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-text-muted mb-1">Voce Paga (nosso preco)</p>
                <p className="text-2xl font-bold text-text-primary">R$ 5,00</p>
                <p className="text-xs text-text-muted">1000 seguidores Instagram</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Voce Cobra (seu preco)</p>
                <p className="text-2xl font-bold text-accent-primary">R$ 15,00</p>
                <p className="text-xs text-text-muted">1000 seguidores Instagram</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Seu Lucro</p>
                <p className="text-2xl font-bold text-accent-success">R$ 10,00</p>
                <p className="text-xs text-accent-success">200% de markup</p>
              </div>
            </div>
            <div className="border-t border-glass-border mt-6 pt-4 text-center">
              <p className="text-sm text-text-secondary">
                Com apenas <span className="text-accent-primary font-semibold">10 vendas por dia</span>,
                voce pode faturar{" "}
                <span className="text-accent-success font-semibold">R$ 3.000/mes</span> de lucro!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
          Dicas para Vender Mais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip, idx) => (
            <Card key={idx}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-glass-bg flex items-center justify-center flex-shrink-0">
                    {tip.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {tip.title}
                    </h3>
                    <p className="text-xs text-text-secondary">{tip.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/api-docs" className="block">
          <Card className="hover:border-accent-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <Code className="h-8 w-8 text-accent-primary mx-auto mb-3" />
              <h3 className="text-sm font-bold text-text-primary mb-1">
                Documentacao da API
              </h3>
              <p className="text-xs text-text-secondary">
                Integre com seu painel SMM
              </p>
              <ArrowRight className="h-4 w-4 text-accent-primary mx-auto mt-3" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/affiliates" className="block">
          <Card className="hover:border-accent-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-accent-secondary mx-auto mb-3" />
              <h3 className="text-sm font-bold text-text-primary mb-1">
                Programa de Afiliados
              </h3>
              <p className="text-xs text-text-secondary">
                Ganhe indicando clientes
              </p>
              <ArrowRight className="h-4 w-4 text-accent-primary mx-auto mt-3" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/add-funds" className="block">
          <Card className="hover:border-accent-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-accent-success mx-auto mb-3" />
              <h3 className="text-sm font-bold text-text-primary mb-1">
                Adicionar Saldo
              </h3>
              <p className="text-xs text-text-secondary">
                Comece agora com R$ 5,00
              </p>
              <ArrowRight className="h-4 w-4 text-accent-primary mx-auto mt-3" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Final CTA */}
      <div className="rounded-xl border border-accent-primary/20 bg-accent-primary/5 p-8 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Pronto para Comecar?
        </h2>
        <p className="text-text-secondary mb-4">
          Adicione saldo e comece a revender agora mesmo.
        </p>
        <Link href="/add-funds">
          <Button size="lg">
            <Rocket className="h-4 w-4" />
            Comecar Agora
          </Button>
        </Link>
      </div>
    </div>
  )
}
