"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "O que é o Brasil Follow?",
    answer:
      "O Brasil Follow é a plataforma líder em serviços de marketing para redes sociais no Brasil. Oferecemos seguidores, curtidas, visualizações e muito mais para Instagram, TikTok, YouTube, Twitter/X, Facebook, Telegram, Spotify e Kwai. Nossa plataforma é totalmente automatizada, garantindo entrega rápida e segura dos serviços.",
  },
  {
    question: "Como funciona a entrega?",
    answer:
      "Após a confirmação do pagamento via PIX, nosso sistema inicia automaticamente a entrega do serviço. A maioria dos pedidos começa a ser processada em poucos minutos. A velocidade de entrega varia conforme o serviço escolhido, mas geralmente seguidores e curtidas são entregues em até 24 horas, podendo ser mais rápido.",
  },
  {
    question: "Quais formas de pagamento?",
    answer:
      "Atualmente aceitamos pagamento via PIX, o método mais rápido e seguro do Brasil. O valor mínimo para depósito é de R$ 5,00. O saldo é creditado instantaneamente após a confirmação do pagamento, permitindo que você faça seu pedido imediatamente.",
  },
  {
    question: "É seguro usar?",
    answer:
      "Sim, é totalmente seguro! Nunca pedimos sua senha. Precisamos apenas do link do seu perfil ou publicação. Nossos serviços são fornecidos por provedores confiáveis e utilizamos métodos seguros que não violam os termos das redes sociais. Seus dados pessoais e de pagamento são protegidos com criptografia.",
  },
  {
    question: "Quanto tempo demora a entrega?",
    answer:
      "O tempo de entrega varia de acordo com o serviço e a quantidade solicitada. Curtidas e visualizações geralmente são entregues em minutos a poucas horas. Seguidores podem levar de 1 a 24 horas para entrega completa. Cada serviço tem uma estimativa de tempo de entrega detalhada na página de pedidos.",
  },
  {
    question: "Posso perder seguidores?",
    answer:
      "Uma pequena queda natural pode ocorrer (geralmente entre 5% a 15%), pois as redes sociais fazem limpezas periódicas. No entanto, muitos dos nossos serviços oferecem garantia de reposição por 30 dias. Caso haja uma queda acima do normal, basta abrir um ticket de suporte e faremos a reposição gratuitamente.",
  },
  {
    question: "Como funciona o programa de afiliados?",
    answer:
      "Nosso programa de afiliados permite que você ganhe comissões indicando novos clientes. Ao se cadastrar, você recebe um link de indicação exclusivo. Cada pessoa que se cadastra e faz um depósito através do seu link gera uma comissão para você, que pode ser usada como saldo na plataforma ou sacada via PIX.",
  },
  {
    question: "Vocês oferecem suporte?",
    answer:
      "Sim! Nosso suporte está disponível de segunda a sábado, das 9h às 22h. Você pode entrar em contato abrindo um ticket diretamente no painel ou enviando um e-mail. Respondemos a maioria dos tickets em até 2 horas durante o horário de atendimento. Para problemas urgentes, priorizamos o atendimento.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 sm:py-28 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Perguntas{" "}
            <span className="gradient-text">Frequentes</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Tire suas dúvidas sobre nossos serviços
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-glass-bg/50 transition-colors"
              >
                <span className="font-medium text-text-primary pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-5 pb-5 text-text-secondary leading-relaxed text-sm">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
