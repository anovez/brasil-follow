import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { encrypt } from "@/lib/encryption"

async function verifyAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const adminId = Number(session.user.id)
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  })
  if (!admin || admin.role !== "ADMIN") return null
  return adminId
}

export async function GET() {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const providers = await prisma.provider.findMany({
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { id: "asc" },
    })

    const formatted = providers.map((p) => ({
      id: p.id,
      name: p.name,
      apiUrl: p.apiUrl,
      balance: Number(p.balance),
      defaultMarkup: Number(p.defaultMarkup),
      currency: p.currency,
      exchangeRate: Number(p.exchangeRate),
      isActive: p.isActive,
      servicesCount: p._count.services,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))

    return NextResponse.json({ providers: formatted })
  } catch (error) {
    console.error("Admin providers GET error:", error)
    return NextResponse.json({ error: "Erro ao carregar provedores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { name, apiUrl, apiKey, defaultMarkup, currency, exchangeRate } = body

    if (!name || !apiUrl || !apiKey) {
      return NextResponse.json(
        { error: "Nome, URL da API e chave da API são obrigatórios" },
        { status: 400 }
      )
    }

    const encryptedKey = encrypt(apiKey)

    const provider = await prisma.provider.create({
      data: {
        name,
        apiUrl,
        apiKey: encryptedKey,
        defaultMarkup: defaultMarkup || 30,
        currency: currency || "BRL",
        exchangeRate: exchangeRate || 1,
        isActive: true,
      },
    })

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_CREATE_PROVIDER",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Criou provedor "${name}" (${apiUrl})`,
        severity: "INFO",
      },
    })

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        name: provider.name,
        apiUrl: provider.apiUrl,
        balance: Number(provider.balance),
        defaultMarkup: Number(provider.defaultMarkup),
        currency: provider.currency,
        exchangeRate: Number(provider.exchangeRate),
        isActive: provider.isActive,
      },
    })
  } catch (error) {
    console.error("Admin providers POST error:", error)
    return NextResponse.json({ error: "Erro ao criar provedor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, apiUrl, apiKey, defaultMarkup, currency, exchangeRate, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (apiUrl !== undefined) data.apiUrl = apiUrl
    if (apiKey !== undefined) data.apiKey = encrypt(apiKey)
    if (defaultMarkup !== undefined) data.defaultMarkup = parseFloat(defaultMarkup)
    if (currency !== undefined) data.currency = currency
    if (exchangeRate !== undefined) data.exchangeRate = parseFloat(exchangeRate)
    if (isActive !== undefined) data.isActive = isActive

    const updated = await prisma.provider.update({
      where: { id: parseInt(id) },
      data,
    })

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_UPDATE_PROVIDER",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Atualizou provedor #${id}`,
        severity: "INFO",
      },
    })

    return NextResponse.json({
      success: true,
      provider: {
        id: updated.id,
        name: updated.name,
        apiUrl: updated.apiUrl,
        balance: Number(updated.balance),
        defaultMarkup: Number(updated.defaultMarkup),
        currency: updated.currency,
        exchangeRate: Number(updated.exchangeRate),
        isActive: updated.isActive,
      },
    })
  } catch (error) {
    console.error("Admin providers PATCH error:", error)
    return NextResponse.json({ error: "Erro ao atualizar provedor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    await prisma.provider.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_DEACTIVATE_PROVIDER",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Desativou provedor #${id}`,
        severity: "WARN",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin providers DELETE error:", error)
    return NextResponse.json({ error: "Erro ao desativar provedor" }, { status: 500 })
  }
}
