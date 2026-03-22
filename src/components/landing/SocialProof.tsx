import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Music,
  Send,
  Video,
  MessageCircle,
} from "lucide-react"

const networks = [
  { name: "Instagram", icon: Instagram, color: "#E1306C" },
  { name: "TikTok", icon: Video, color: "#00f2ea" },
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
  { name: "Twitter/X", icon: Twitter, color: "#1DA1F2" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "Telegram", icon: Send, color: "#0088cc" },
  { name: "Spotify", icon: Music, color: "#1DB954" },
  { name: "Kwai", icon: MessageCircle, color: "#FF7A00" },
]

export function SocialProof() {
  return (
    <section className="py-8 border-y border-glass-border bg-glass-bg/50 overflow-hidden">
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

        {/* Scrolling container */}
        <div className="flex animate-scroll gap-8 sm:gap-12 w-max">
          {[...networks, ...networks].map((network, i) => {
            const Icon = network.icon
            return (
              <div
                key={`${network.name}-${i}`}
                className="flex items-center gap-3 px-5 py-3 rounded-xl glass-card shrink-0 hover:border-accent-primary/30 transition-colors"
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: network.color }}
                />
                <span className="text-text-primary font-medium whitespace-nowrap">
                  {network.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
