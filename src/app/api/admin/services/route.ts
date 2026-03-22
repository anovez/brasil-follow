import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

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

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const providerId = searchParams.get("providerId")
    const search = searchParams.get("search") || ""
    const activeOnly = searchParams.get("activeOnly")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }
    if (providerId) {
      where.providerId = parseInt(providerId)
    }
    if (activeOnly === "true") {
      where.isActive = true
    }
    if (search) {
      where.name = { contains: search }
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          provider: { select: { id: true, name: true } },
          _count: { select: { orders: true } },
        },
        orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ])

    const formattedServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: { id: s.category.id, name: s.category.name },
      provider: { id: s.provider.id, name: s.provider.name },
      pricePerThousand: Number(s.pricePerThousand),
      costPerThousand: Number(s.costPerThousand),
      profitMargin:
        Number(s.costPerThousand) > 0
          ? Math.round(
              ((Number(s.pricePerThousand) - Number(s.costPerThousand)) /
                Number(s.costPerThousand)) *
                10000
            ) / 100
          : 0,
      minQuantity: s.minQuantity,
      maxQuantity: s.maxQuantity,
      providerServiceId: s.providerServiceId,
      type: s.type,
      quality: s.quality,
      dripfeed: s.dripfeed,
      refill: s.refill,
      refillDays: s.refillDays,
      isActive: s.isActive,
      sortOrder: s.sortOrder,
      ordersCount: s._count.orders,
      createdAt: s.createdAt.toISOString(),
    }))

    return NextResponse.json({
      services: formattedServices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Admin services GET error:", error)
    return NextResponse.json({ error: "Erro ao carregar serviços" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { id, pricePerThousand, isActive, quality, sortOrder, name, description } = body

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (pricePerThousand !== undefined) data.pricePerThousand = parseFloat(pricePerThousand)
    if (isActive !== undefined) data.isActive = isActive
    if (quality !== undefined) data.quality = quality
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder)
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description

    const updated = await prisma.service.update({
      where: { id: parseInt(id) },
      data,
    })

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_UPDATE_SERVICE",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Atualizou serviço #${id}: ${JSON.stringify(data)}`,
        severity: "INFO",
      },
    })

    return NextResponse.json({ success: true, service: updated })
  } catch (error) {
    console.error("Admin services PATCH error:", error)
    return NextResponse.json({ error: "Erro ao atualizar serviço" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "bulk-markup") {
      const { serviceIds, markup } = body
      if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return NextResponse.json({ error: "serviceIds é obrigatório" }, { status: 400 })
      }
      if (markup === undefined || markup === null) {
        return NextResponse.json({ error: "markup é obrigatório" }, { status: 400 })
      }

      const markupMultiplier = 1 + parseFloat(markup) / 100
      let updated = 0

      for (const sId of serviceIds) {
        const service = await prisma.service.findUnique({
          where: { id: sId },
          select: { costPerThousand: true },
        })
        if (service) {
          const newPrice = Number(service.costPerThousand) * markupMultiplier
          await prisma.service.update({
            where: { id: sId },
            data: { pricePerThousand: Math.round(newPrice * 10000) / 10000 },
          })
          updated++
        }
      }

      await prisma.securityLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_BULK_MARKUP",
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          details: `Markup ${markup}% aplicado a ${updated} serviços`,
          severity: "INFO",
        },
      })

      return NextResponse.json({ success: true, updated })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("Admin services POST error:", error)
    return NextResponse.json({ error: "Erro ao executar ação" }, { status: 500 })
  }
}
