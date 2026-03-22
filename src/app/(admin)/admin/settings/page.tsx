"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Globe,
  CreditCard,
  Mail,
  Users,
  Shield,
  Save,
} from "lucide-react"

interface SettingsMap {
  [key: string]: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("general")

  async function fetchSettings() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setSettings(data.settings)
    } catch {
      setSettings({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(keys: string[]) {
    setSaving(true)
    try {
      const subset: SettingsMap = {}
      for (const key of keys) {
        if (settings[key] !== undefined) {
          subset[key] = settings[key]
        }
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: subset }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao salvar")
        return
      }
      alert(`${data.updated} configuracao(oes) atualizada(s)`)
    } catch {
      alert("Erro ao salvar configuracoes")
    } finally {
      setSaving(false)
    }
  }

  function SettingField({
    label,
    settingKey,
    type = "text",
    placeholder,
    description,
  }: {
    label: string
    settingKey: string
    type?: string
    placeholder?: string
    description?: string
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-secondary">{label}</label>
        <Input
          type={type}
          value={settings[settingKey] || ""}
          onChange={(e) => updateSetting(settingKey, e.target.value)}
          placeholder={placeholder}
        />
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
    )
  }

  function SettingToggle({
    label,
    settingKey,
    description,
  }: {
    label: string
    settingKey: string
    description?: string
  }) {
    const checked = settings[settingKey] === "true"
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
        <Switch
          checked={checked}
          onCheckedChange={(v) => updateSetting(settingKey, String(v))}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Configuracoes</h1>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Configuracoes</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-1" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-1" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-1" />
            Email
          </TabsTrigger>
          <TabsTrigger value="affiliates">
            <Users className="h-4 w-4 mr-1" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-1" />
            Seguranca
          </TabsTrigger>
          <TabsTrigger value="oauth">
            <Globe className="h-4 w-4 mr-1" />
            Google OAuth
          </TabsTrigger>
        </TabsList>

        {/* Geral */}
        <TabsContent value="general">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Configuracoes Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Nome do Site"
                settingKey="site_name"
                placeholder="Brasil Follow"
              />
              <SettingField
                label="URL do Site"
                settingKey="site_url"
                placeholder="https://brasilfollow.com"
              />
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  loading={saving}
                  onClick={() => handleSave(["site_name", "site_url"])}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagamentos */}
        <TabsContent value="payments">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Configuracoes de Pagamento (EFI/Gerencianet)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Client ID"
                settingKey="efi_client_id"
                placeholder="Client_Id_..."
              />
              <SettingField
                label="Client Secret"
                settingKey="efi_client_secret"
                type="password"
                placeholder="Client_Secret_..."
              />
              <SettingField
                label="Chave PIX"
                settingKey="efi_pix_key"
                placeholder="sua-chave-pix@email.com"
                description="Chave PIX cadastrada na EFI"
              />
              <SettingField
                label="Certificado (Base64)"
                settingKey="efi_pix_cert"
                type="password"
                placeholder="Base64 do certificado .p12"
                description="Certificado .p12 convertido para Base64"
              />
              <SettingToggle
                label="Modo Sandbox"
                settingKey="efi_sandbox"
                description="Usar ambiente de testes da EFI"
              />
              <SettingField
                label="Deposito Minimo (R$)"
                settingKey="min_deposit"
                type="number"
                placeholder="5.00"
              />
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  loading={saving}
                  onClick={() =>
                    handleSave([
                      "efi_client_id",
                      "efi_client_secret",
                      "efi_pix_key",
                      "efi_pix_cert",
                      "efi_sandbox",
                      "min_deposit",
                    ])
                  }
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Configuracoes de Email (SMTP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Host SMTP"
                settingKey="smtp_host"
                placeholder="smtp.gmail.com"
              />
              <SettingField
                label="Porta"
                settingKey="smtp_port"
                type="number"
                placeholder="587"
              />
              <SettingField
                label="Usuario"
                settingKey="smtp_user"
                placeholder="email@gmail.com"
              />
              <SettingField
                label="Senha"
                settingKey="smtp_password"
                type="password"
                placeholder="Senha ou App Password"
              />
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  loading={saving}
                  onClick={() =>
                    handleSave(["smtp_host", "smtp_port", "smtp_user", "smtp_password"])
                  }
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Afiliados */}
        <TabsContent value="affiliates">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Programa de Afiliados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingToggle
                label="Programa Ativo"
                settingKey="affiliate_enabled"
                description="Ativar ou desativar o programa de afiliados"
              />
              <SettingField
                label="Comissao (%)"
                settingKey="affiliate_commission"
                type="number"
                placeholder="5"
                description="Percentual de comissao sobre cada pedido do indicado"
              />
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  loading={saving}
                  onClick={() =>
                    handleSave(["affiliate_enabled", "affiliate_commission"])
                  }
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seguranca */}
        <TabsContent value="security">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Seguranca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Cron Secret"
                settingKey="cron_secret"
                type="password"
                placeholder="Uma string secreta para autenticar cron jobs"
                description="Usada para autenticar chamadas de cron (sync de pedidos, etc)"
              />
              <SettingToggle
                label="Modo Manutencao"
                settingKey="maintenance_mode"
                description="Bloquear acesso ao site para usuarios nao-admin"
              />
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  loading={saving}
                  onClick={() =>
                    handleSave(["cron_secret", "maintenance_mode"])
                  }
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google OAuth */}
        <TabsContent value="oauth">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Google OAuth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingField
                label="Client ID"
                settingKey="google_client_id"
                placeholder="xxxxxxx.apps.googleusercontent.com"
              />
              <SettingField
                label="Client Secret"
                settingKey="google_client_secret"
                type="password"
                placeholder="GOCSPX-..."
              />
              <p className="text-xs text-text-muted">
                Configurado no Google Cloud Console. Redirect URI: {settings.site_url || "https://seusite.com"}/api/auth/callback/google
              </p>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  loading={saving}
                  onClick={() =>
                    handleSave(["google_client_id", "google_client_secret"])
                  }
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
