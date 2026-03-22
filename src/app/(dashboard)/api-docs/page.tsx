"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Copy,
  Check,
  Key,
  RefreshCw,
  Code,
  Globe,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { maskApiKey } from "@/lib/utils"

const BASE_URL = "https://brasilfollow.com/api/v2"

const endpoints = [
  {
    name: "balance",
    title: "Consultar Saldo",
    description: "Retorna o saldo atual da conta",
    params: [
      { name: "key", type: "string", desc: "Sua chave de API" },
      { name: "action", type: "string", desc: '"balance"' },
    ],
  },
  {
    name: "services",
    title: "Listar Servicos",
    description: "Retorna todos os servicos disponiveis",
    params: [
      { name: "key", type: "string", desc: "Sua chave de API" },
      { name: "action", type: "string", desc: '"services"' },
    ],
  },
  {
    name: "add",
    title: "Criar Pedido",
    description: "Cria um novo pedido",
    params: [
      { name: "key", type: "string", desc: "Sua chave de API" },
      { name: "action", type: "string", desc: '"add"' },
      { name: "service", type: "number", desc: "ID do servico" },
      { name: "link", type: "string", desc: "URL do perfil/post" },
      { name: "quantity", type: "number", desc: "Quantidade desejada" },
    ],
  },
  {
    name: "status",
    title: "Status do Pedido",
    description: "Verifica o status de um pedido",
    params: [
      { name: "key", type: "string", desc: "Sua chave de API" },
      { name: "action", type: "string", desc: '"status"' },
      { name: "order", type: "number", desc: "ID do pedido" },
    ],
  },
  {
    name: "cancel",
    title: "Cancelar Pedido",
    description: "Cancela um pedido pendente",
    params: [
      { name: "key", type: "string", desc: "Sua chave de API" },
      { name: "action", type: "string", desc: '"cancel"' },
      { name: "order", type: "number", desc: "ID do pedido" },
    ],
  },
  {
    name: "refill",
    title: "Reposicao",
    description: "Solicita reposicao de um pedido com garantia",
    params: [
      { name: "key", type: "string", desc: "Sua chave de API" },
      { name: "action", type: "string", desc: '"refill"' },
      { name: "order", type: "number", desc: "ID do pedido" },
    ],
  },
]

function generateExample(endpoint: (typeof endpoints)[0], lang: string, apiKey: string) {
  const key = apiKey || "SUA_API_KEY"
  const params: Record<string, string> = { key, action: endpoint.name }
  if (endpoint.name === "add") {
    params.service = "1"
    params.link = "https://instagram.com/perfil"
    params.quantity = "1000"
  }
  if (endpoint.name === "status" || endpoint.name === "cancel" || endpoint.name === "refill") {
    params.order = "12345"
  }

  switch (lang) {
    case "curl":
      const curlParams = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&")
      return `curl -X POST "${BASE_URL}" \\
  -d "${curlParams}"`

    case "python":
      return `import requests

response = requests.post("${BASE_URL}", data=${JSON.stringify(params, null, 4)})
print(response.json())`

    case "php":
      const phpParams = Object.entries(params)
        .map(([k, v]) => `    '${k}' => '${v}'`)
        .join(",\n")
      return `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${BASE_URL}");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
${phpParams}
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`

    case "nodejs":
      return `const response = await fetch("${BASE_URL}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${JSON.stringify(params, null, 4)})
});
const data = await response.json();
console.log(data);`

    default:
      return ""
  }
}

const responseExamples: Record<string, string> = {
  balance: `{
  "balance": "150.25",
  "currency": "BRL"
}`,
  services: `[
  {
    "service": 1,
    "name": "Seguidores Instagram - Premium",
    "rate": "12.50",
    "min": 100,
    "max": 50000,
    "type": "Default",
    "category": "Instagram - Seguidores"
  }
]`,
  add: `{
  "order": 12345
}`,
  status: `{
  "status": "In progress",
  "charge": "3.75",
  "start_count": "1024",
  "remains": "250"
}`,
  cancel: `{
  "cancel": 1
}`,
  refill: `{
  "refill": 1
}`,
}

export default function ApiDocsPage() {
  const queryClient = useQueryClient()
  const [copiedKey, setCopiedKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState("balance")
  const [codeLang, setCodeLang] = useState("curl")

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user-api-key"],
    queryFn: async () => {
      const res = await fetch("/api/balance")
      if (!res.ok) throw new Error("Failed")
      const json = await res.json()
      return json.data as { balance: number; level: string }
    },
  })

  // Store the API key locally (fetched indirectly)
  const [apiKey, setApiKey] = useState("")

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/api-key", { method: "POST" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed")
      }
      const json = await res.json()
      return json.data.apiKey as string
    },
    onSuccess: (newKey) => {
      setApiKey(newKey)
      setShowKey(true)
      toast.success("Chave da API regenerada com sucesso!")
      setConfirmRegenerate(false)
    },
    onError: () => {
      toast.error("Erro ao regenerar chave da API")
    },
  })

  const copyApiKey = async () => {
    if (!apiKey) {
      toast.error("Gere sua chave da API primeiro")
      return
    }
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopiedKey(true)
      toast.success("Chave copiada!")
      setTimeout(() => setCopiedKey(false), 3000)
    } catch {
      toast.error("Erro ao copiar")
    }
  }

  const currentEndpoint = endpoints.find((e) => e.name === selectedEndpoint) || endpoints[0]
  const codeExample = generateExample(currentEndpoint, codeLang, apiKey)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Documentacao da API</h1>
        <p className="text-text-secondary mt-1">
          Use nossa API para integrar com seu sistema ou painel de revenda.
        </p>
      </div>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sua Chave da API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded-lg border border-glass-border bg-glass-bg px-4 py-2.5 text-sm font-mono flex-1 w-full">
              {apiKey ? (showKey ? apiKey : maskApiKey(apiKey)) : "Clique em 'Regenerar' para gerar sua chave"}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {apiKey && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? "Ocultar" : "Mostrar"}
                  </Button>
                  <Button
                    variant={copiedKey ? "secondary" : "outline"}
                    size="sm"
                    onClick={copyApiKey}
                  >
                    {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedKey ? "Copiado!" : "Copiar"}
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmRegenerate(true)}
              >
                <RefreshCw className="h-4 w-4" />
                Regenerar
              </Button>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Mantenha sua chave em seguranca. Nao compartilhe com ninguem.
          </p>
        </CardContent>
      </Card>

      {/* Base URL + Rate Limit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Base URL</p>
                <p className="text-sm font-mono text-text-primary">POST {BASE_URL}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent-warning/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-accent-warning" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Rate Limit</p>
                <p className="text-sm text-text-primary">60 requisicoes por minuto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Endpoint Tabs */}
          <Tabs value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {endpoints.map((ep) => (
                <TabsTrigger key={ep.name} value={ep.name} className="text-xs">
                  {ep.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {endpoints.map((ep) => (
              <TabsContent key={ep.name} value={ep.name}>
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{ep.title}</h3>
                    <p className="text-sm text-text-secondary">{ep.description}</p>
                  </div>

                  {/* Parameters */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Parametros</h4>
                    <div className="rounded-lg border border-glass-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-glass-border bg-glass-bg">
                            <th className="text-left px-4 py-2 text-text-muted font-medium">Parametro</th>
                            <th className="text-left px-4 py-2 text-text-muted font-medium">Tipo</th>
                            <th className="text-left px-4 py-2 text-text-muted font-medium">Descricao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((param) => (
                            <tr key={param.name} className="border-b border-glass-border last:border-0">
                              <td className="px-4 py-2 font-mono text-accent-primary">{param.name}</td>
                              <td className="px-4 py-2">
                                <Badge variant="outline" className="text-xs">{param.type}</Badge>
                              </td>
                              <td className="px-4 py-2 text-text-secondary">{param.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Code examples */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Exemplos</h4>
                    <Tabs value={codeLang} onValueChange={setCodeLang}>
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                        <TabsTrigger value="php">PHP</TabsTrigger>
                        <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                      </TabsList>

                      {["curl", "python", "php", "nodejs"].map((lang) => (
                        <TabsContent key={lang} value={lang}>
                          <div className="relative">
                            <pre className="rounded-lg border border-glass-border bg-bg-primary p-4 text-xs font-mono text-text-secondary overflow-x-auto">
                              {generateExample(ep, lang, apiKey)}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                navigator.clipboard.writeText(generateExample(ep, lang, apiKey))
                                toast.success("Codigo copiado!")
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  {/* Response example */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Resposta</h4>
                    <pre className="rounded-lg border border-glass-border bg-bg-primary p-4 text-xs font-mono text-accent-success overflow-x-auto">
                      {responseExamples[ep.name]}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Regenerate Confirmation */}
      <Dialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent-warning" />
              Regenerar Chave da API
            </DialogTitle>
            <DialogDescription>
              Ao regenerar, a chave atual sera invalidada imediatamente. Todos os
              sistemas que usam a chave antiga pararao de funcionar. Tem certeza?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => regenerateMutation.mutate()}
              loading={regenerateMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" />
              Confirmar Regeneracao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
