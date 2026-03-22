"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ShoppingCart,
  Wallet,
  Code,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle,
  Play,
  CreditCard,
  Link as LinkIcon,
  Hash,
  Send,
  QrCode,
  Key,
  Zap,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface AccordionItem {
  question: string
  answer: string
}

function AccordionSection({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-glass-border bg-glass-bg overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-glass-bg/50 transition-colors"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <span className="text-sm font-medium text-text-primary">{item.question}</span>
            {openIndex === idx ? (
              <ChevronUp className="h-4 w-4 text-text-muted flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted flex-shrink-0" />
            )}
          </button>
          {openIndex === idx && (
            <div className="px-4 pb-4 text-sm text-text-secondary">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const faqItems: AccordionItem[] = [
  {
    question: "Quanto tempo demora para entregar?",
    answer:
      "O tempo de entrega varia de acordo com o servico. Servicos marcados com ⚡ sao rapidos (ate 1h). Servicos com ❄️ podem levar ate 24h. O tempo medio esta na descricao de cada servico.",
  },
  {
    question: "Os seguidores/curtidas sao reais?",
    answer:
      "Depende do servico escolhido. Servicos Premium (👑) e Alta qualidade (🏆) utilizam contas de maior qualidade. Servicos de qualidade Media (🥈) e Baixa (🥉) sao mais acessiveis mas podem ter qualidade menor.",
  },
  {
    question: "O que acontece se cair seguidores?",
    answer:
      "Servicos com garantia (♻️) possuem reposicao automatica dentro do periodo de garantia. Servicos sem garantia (❌) nao oferecem reposicao. Verifique a garantia antes de comprar.",
  },
  {
    question: "Posso cancelar um pedido?",
    answer:
      "Pedidos com status 'Pendente' podem ser cancelados. Apos o processamento iniciar, o cancelamento nao e possivel. O saldo e automaticamente reembolsado em caso de cancelamento.",
  },
  {
    question: "Qual o valor minimo de deposito?",
    answer:
      "O valor minimo para deposito via PIX e de R$ 5,00. O pagamento e processado instantaneamente apos a confirmacao do PIX.",
  },
  {
    question: "A API tem limite de requisicoes?",
    answer:
      "Sim, o limite e de 60 requisicoes por minuto. Caso ultrapasse, voce recebera um erro 429 (Too Many Requests) e devera aguardar antes de tentar novamente.",
  },
  {
    question: "Como funciona o programa de niveis?",
    answer:
      "Conforme voce gasta na plataforma, sobe de nivel automaticamente: Bronze (0%), Prata (3% desc. a partir de R$100), Ouro (5% desc. a partir de R$500), Diamante (10% desc. a partir de R$2.000).",
  },
  {
    question: "Minha conta e segura?",
    answer:
      "Sim! Nao solicitamos senhas de redes sociais. Apenas o link do perfil ou post e necessario. Nunca compartilhe sua senha com ninguem.",
  },
]

export default function TutorialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Tutorial</h1>
        <p className="text-text-secondary mt-1">
          Aprenda a usar a plataforma Brasil Follow passo a passo.
        </p>
      </div>

      <Tabs defaultValue="order">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="order" className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            Como Fazer Pedido
          </TabsTrigger>
          <TabsTrigger value="funds" className="flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            Como Adicionar Saldo
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Como Usar a API
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Duvidas Comuns
          </TabsTrigger>
        </TabsList>

        {/* How to Order */}
        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-accent-primary" />
                Como Fazer um Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Acesse a pagina de Novo Pedido
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Clique no botao &quot;Novo Pedido&quot; no menu lateral ou na pagina inicial.
                    </p>
                    <div className="mt-2 rounded-lg border border-glass-border bg-glass-bg p-3 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-accent-primary" />
                      <span className="text-xs text-text-muted">Menu &gt; Novo Pedido</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Selecione a Categoria e o Servico
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Escolha a rede social (ex: Instagram) e depois o servico especifico
                      (ex: Seguidores Premium). Verifique o preco por 1000 unidades e a qualidade.
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-glass-border bg-glass-bg p-2 flex items-center gap-1">
                        <span>👑</span> Premium
                      </div>
                      <div className="rounded-lg border border-glass-border bg-glass-bg p-2 flex items-center gap-1">
                        <span>🏆</span> Alta Qualidade
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Insira o Link
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Cole o link do perfil ou publicacao. Por exemplo:
                      https://instagram.com/seu_perfil. A plataforma detecta
                      automaticamente a rede social.
                    </p>
                    <div className="mt-2 rounded-lg border border-glass-border bg-glass-bg p-3 flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-pink-400" />
                      <span className="text-xs text-text-muted font-mono">
                        https://instagram.com/seu_perfil
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-primary font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Defina a Quantidade
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Digite ou use o slider para definir a quantidade desejada. O preco
                      total e calculado automaticamente em tempo real.
                    </p>
                    <div className="mt-2 rounded-lg border border-glass-border bg-glass-bg p-3 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-text-muted" />
                      <span className="text-xs text-text-muted">Min: 100 | Max: 50.000</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-accent-success" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Confirme e Envie
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Revise o resumo do pedido e clique em &quot;Enviar Pedido&quot;. O valor
                      sera debitado do seu saldo e o pedido sera processado automaticamente.
                    </p>
                    <div className="mt-3">
                      <Link href="/new-order">
                        <Button size="sm">
                          <Send className="h-3 w-3" />
                          Fazer um Pedido Agora
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* How to Add Funds */}
        <TabsContent value="funds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent-success" />
                Como Adicionar Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-success/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-success font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Acesse &quot;Adicionar Saldo&quot;
                    </h3>
                    <p className="text-sm text-text-secondary">
                      No menu lateral, clique em &quot;Adicionar Saldo&quot; ou use o botao
                      rapido no painel.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-success/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-success font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Escolha o Valor
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Selecione um valor predefinido (R$ 10, R$ 25, R$ 50, R$ 100) ou
                      digite um valor personalizado. O minimo e R$ 5,00.
                    </p>
                    <div className="mt-2 flex gap-2">
                      {[10, 25, 50, 100].map((v) => (
                        <div
                          key={v}
                          className="rounded-lg border border-glass-border bg-glass-bg px-3 py-1.5 text-xs text-text-secondary"
                        >
                          R$ {v}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-success/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-success font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Gere o QR Code PIX
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Clique em &quot;Gerar PIX&quot;. Um QR Code sera gerado com validade de
                      30 minutos. Voce pode escanear ou copiar o codigo para colar no
                      app do seu banco.
                    </p>
                    <div className="mt-2 rounded-lg border border-glass-border bg-glass-bg p-3 flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-text-muted" />
                      <span className="text-xs text-text-muted">QR Code valido por 30 min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-accent-success" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Pagamento Confirmado Automaticamente
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Apos efetuar o pagamento, o sistema detecta automaticamente em
                      alguns segundos e credita o saldo na sua conta. Voce sera
                      redirecionado ao painel.
                    </p>
                    <div className="mt-3">
                      <Link href="/add-funds">
                        <Button size="sm" variant="secondary">
                          <Wallet className="h-3 w-3" />
                          Adicionar Saldo Agora
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* How to Use API */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-accent-secondary" />
                Como Usar a API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-secondary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Obtenha sua Chave de API
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Acesse a pagina de Documentacao da API e gere ou copie sua chave.
                      Mantenha-a em seguranca.
                    </p>
                    <div className="mt-2 rounded-lg border border-glass-border bg-glass-bg p-3 flex items-center gap-2">
                      <Key className="h-4 w-4 text-text-muted" />
                      <span className="text-xs text-text-muted font-mono">bf_abc123...</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-secondary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Faca Requisicoes POST
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Todas as requisicoes devem ser enviadas via POST para o endpoint
                      da API. Inclua sua chave e a acao desejada.
                    </p>
                    <pre className="mt-2 rounded-lg border border-glass-border bg-bg-primary p-3 text-xs font-mono text-text-secondary overflow-x-auto">
{`POST https://brasilfollow.com/api/v2
{
  "key": "sua_chave",
  "action": "services"
}`}
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-secondary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Acoes Disponiveis
                    </h3>
                    <p className="text-sm text-text-secondary mb-2">
                      A API oferece as seguintes acoes:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { action: "balance", desc: "Consultar saldo" },
                        { action: "services", desc: "Listar servicos" },
                        { action: "add", desc: "Criar pedido" },
                        { action: "status", desc: "Status do pedido" },
                        { action: "cancel", desc: "Cancelar pedido" },
                        { action: "refill", desc: "Solicitar reposicao" },
                      ].map((a) => (
                        <div
                          key={a.action}
                          className="rounded-lg border border-glass-border bg-glass-bg p-2 flex items-center gap-2"
                        >
                          <code className="text-xs text-accent-primary font-mono">
                            {a.action}
                          </code>
                          <span className="text-xs text-text-secondary">{a.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-accent-warning" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Limite de Requisicoes
                    </h3>
                    <p className="text-sm text-text-secondary">
                      O limite e de 60 requisicoes por minuto. Utilize cache para
                      endpoints como &quot;services&quot; que nao mudam com frequencia.
                    </p>
                    <div className="mt-3">
                      <Link href="/api-docs">
                        <Button size="sm" variant="secondary">
                          <Code className="h-3 w-3" />
                          Ver Documentacao Completa
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-accent-warning" />
                Duvidas Comuns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AccordionSection items={faqItems} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help CTA */}
      <div className="rounded-xl border border-glass-border bg-glass-bg p-6 text-center">
        <h3 className="text-lg font-bold text-text-primary mb-2">
          Ainda tem duvidas?
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Nossa equipe de suporte esta pronta para ajudar voce.
        </p>
        <Link href="/support">
          <Button variant="secondary">
            <MessageSquare className="h-4 w-4" />
            Abrir Ticket de Suporte
          </Button>
        </Link>
      </div>
    </div>
  )
}
