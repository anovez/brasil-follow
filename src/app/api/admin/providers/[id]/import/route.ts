import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ProviderManager } from "@/lib/providers/provider-manager"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const adminId = Number(session.user.id)
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { id } = await params
    const providerId = parseInt(id)

    if (isNaN(providerId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    })

    if (!provider) {
      return NextResponse.json({ error: "Provedor não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const markup = parseFloat(body.markup || String(provider.defaultMarkup))

    const results = await ProviderManager.importServices(providerId, markup, true)

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_IMPORT_SERVICES",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Importou serviços do provedor "${provider.name}": ${results.imported} importados, ${results.skipped} ignorados, ${results.categories} categorias criadas (markup: ${markup}%)`,
        severity: "INFO",
      },
    })

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Provider import error:", error)
    const message = error instanceof Error ? error.message : "Erro ao importar serviços"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
