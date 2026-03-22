"use client"

import { useEffect, useState } from "react"
import { ShoppingBag, X } from "lucide-react"

const names = [
  "Maria", "João", "Ana", "Pedro", "Beatriz", "Lucas", "Juliana",
  "Rafael", "Camila", "Gabriel", "Larissa", "Matheus", "Fernanda",
  "Bruno", "Letícia", "Diego", "Isabela", "Thiago", "Amanda", "Vinícius",
]

const cities = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba",
  "Salvador", "Fortaleza", "Brasília", "Recife", "Porto Alegre",
  "Manaus", "Goiânia", "Belém", "Campinas", "Florianópolis",
]

const actions = [
  { text: "comprou 1.000 seguidores", service: "Instagram" },
  { text: "comprou 5.000 curtidas", service: "Instagram" },
  { text: "comprou 2.000 seguidores", service: "TikTok" },
  { text: "comprou 10.000 visualizações", service: "YouTube" },
  { text: "comprou 500 inscritos", service: "YouTube" },
  { text: "comprou 3.000 curtidas", service: "TikTok" },
  { text: "comprou 1.500 seguidores", service: "Instagram" },
  { text: "adicionou R$ 50,00 de saldo", service: "PIX" },
  { text: "comprou 2.500 seguidores", service: "Twitter/X" },
  { text: "comprou 500 curtidas na página", service: "Facebook" },
]

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface Notification {
  name: string
  city: string
  action: string
  id: number
}

export function SocialNotification() {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let dismissTimer: ReturnType<typeof setTimeout>

    const showNotification = () => {
      const action = getRandomItem(actions)
      setNotification({
        name: getRandomItem(names),
        city: getRandomItem(cities),
        action: action.text,
        id: Date.now(),
      })
      setVisible(true)

      dismissTimer = setTimeout(() => {
        setVisible(false)
      }, 4000)
    }

    // Show first notification after 5 seconds
    const initialTimer = setTimeout(showNotification, 5000)

    // Then every 15 seconds
    const intervalTimer = setInterval(showNotification, 15000)

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(dismissTimer)
      clearInterval(intervalTimer)
    }
  }, [])

  if (!notification) return null

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="glass-card p-4 pr-10 flex items-center gap-3 max-w-sm shadow-xl shadow-black/20">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-success to-emerald-600 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div>
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{notification.name}</span> de{" "}
            <span className="text-text-secondary">{notification.city}</span>
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {notification.action}
          </p>
          <p className="text-[10px] text-text-muted/60 mt-1">agora mesmo</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
