import Link from "next/link"
import { Instagram, Send, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-glass-border bg-bg-secondary/50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold gradient-text mb-3">
              Brasil Follow
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              A plataforma mais confiável do Brasil para impulsionar suas redes
              sociais. Seguidores, curtidas, visualizações e muito mais com
              entrega automática.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-text-secondary text-sm hover:text-accent-primary transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-text-secondary text-sm hover:text-accent-primary transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-text-secondary text-sm hover:text-accent-primary transition-colors"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-text-secondary text-sm hover:text-accent-primary transition-colors"
                >
                  Criar Conta
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-text-secondary text-sm hover:text-accent-primary transition-colors"
                >
                  Entrar
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">
              Redes Sociais
            </h4>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:border-accent-primary/40 transition-colors"
              >
                <Instagram className="w-5 h-5 text-text-secondary" />
              </a>
              <a
                href="#"
                aria-label="Telegram"
                className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:border-accent-primary/40 transition-colors"
              >
                <Send className="w-5 h-5 text-text-secondary" />
              </a>
              <a
                href="#"
                aria-label="Email"
                className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:border-accent-primary/40 transition-colors"
              >
                <Mail className="w-5 h-5 text-text-secondary" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-glass-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            &copy; 2024 Brasil Follow. Todos os direitos reservados.
          </p>
          <p className="text-text-muted text-xs">
            Este site não é afiliado a nenhuma rede social mencionada.
          </p>
        </div>
      </div>
    </footer>
  )
}
