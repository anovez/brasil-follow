import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ProviderManager } from "@/lib/providers/provider-manager"

export async function GET(
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
      select: { id: true, name: true },
    })

    if (!provider) {
      return NextResponse.json({ error: "Provedor não encontrado" }, { status: 404 })
    }

    const smmProvider = await ProviderManager.getProvider(providerId)
    const balance = await smmProvider.getBalance()

    await prisma.provider.update({
      where: { id: providerId },
      data: { balance },
    })

    return NextResponse.json({ success: true, balance, name: provider.name })
  } catch (error) {
    console.error("Provider balance check error:", error)
    const message = error instanceof Error ? error.message : "Erro ao verificar saldo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
