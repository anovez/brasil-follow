import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ProviderManager } from "@/lib/providers/provider-manager"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "ALL"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const userSearch = searchParams.get("userSearch") || ""
    const serviceId = searchParams.get("serviceId")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const format = searchParams.get("format")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status !== "ALL") {
      where.status = status
    }

    if (dateFrom) {
      where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(dateFrom) }
    }

    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      where.createdAt = { ...(where.createdAt as object || {}), lte: endDate }
    }

    if (userSearch) {
      where.user = {
        OR: [
          { email: { contains: userSearch } },
          { username: { contains: userSearch } },
          { name: { contains: userSearch } },
        ],
      }
    }

    if (serviceId) {
      where.serviceId = parseInt(serviceId)
    }

    // Get totals for current filter
    const totals = await prisma.order.aggregate({
      where,
      _sum: { amount: true, cost: true, profit: true },
      _count: true,
    })

    // CSV export
    if (format === "csv") {
      const allOrders = await prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, username: true } },
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10000,
      })

      const csvHeader =
        "ID,Usuário,Email,Serviço,Link,Quantidade,Valor,Custo,Lucro,Status,Data\n"
      const csvRows = allOrders
        .map((o) => {
          const escapeCsv = (s: string) =>
            `"${s.replace(/"/g, '""')}"`
          return [
            o.id,
            escapeCsv(o.user.name || ""),
            escapeCsv(o.user.email),
            escapeCsv(o.service.name),
            escapeCsv(o.link),
            o.quantity,
            Number(o.amount).toFixed(2),
            Number(o.cost).toFixed(2),
            Number(o.profit).toFixed(2),
            o.status,
            o.createdAt.toISOString(),
          ].join(",")
        })
        .join("\n")

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, username: true } },
          service: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      externalId: o.externalId,
      user: {
        id: o.user.id,
        name: o.user.name,
        email: o.user.email,
        username: o.user.username,
      },
      service: {
        id: o.service.id,
        name: o.service.name,
      },
      link: o.link,
      quantity: o.quantity,
      amount: Number(o.amount),
      cost: Number(o.cost),
      profit: Number(o.profit),
      status: o.status,
      providerOrderId: o.providerOrderId,
      startCount: o.startCount,
      remains: o.remains,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      orders: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totals: {
        count: totals._count,
        revenue: Number(totals._sum.amount) || 0,
        cost: Number(totals._sum.cost) || 0,
        profit: Number(totals._sum.profit) || 0,
      },
    })
  } catch (error) {
    console.error("Admin orders error:", error)
    return NextResponse.json(
      { error: "Erro ao carregar pedidos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { action, orderId, orderIds } = body

    switch (action) {
      case "sync": {
        if (!orderId) {
          return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 })
        }

        const result = await ProviderManager.syncOrder(orderId)
        if (!result) {
          return NextResponse.json(
            { error: "Pedido não encontrado ou sem ID do provedor" },
            { status: 404 }
          )
        }

        await prisma.securityLog.create({
          data: {
            userId: adminId,
            action: "ADMIN_SYNC_ORDER",
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            details: `Sync pedido #${orderId}: ${result.status}`,
            severity: "INFO",
          },
        })

        return NextResponse.json({ success: true, result })
      }

      case "cancel": {
        if (!orderId) {
          return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { user: true },
        })

        if (!order) {
          return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
        }

        if (order.status === "CANCELLED" || order.status === "REFUNDED") {
          return NextResponse.json(
            { error: "Pedido já cancelado ou reembolsado" },
            { status: 400 }
          )
        }

        const refundAmount = Number(order.amount)

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
          })

          const currentBalance = Number(order.user.balance)
          const newBalance = currentBalance + refundAmount

          await tx.user.update({
            where: { id: order.userId },
            data: { balance: newBalance },
          })

          await tx.balanceLog.create({
            data: {
              userId: order.userId,
              amount: refundAmount,
              balanceAfter: newBalance,
              type: "REFUND",
              description: `Reembolso por cancelamento admin - Pedido #${orderId}`,
              adminId,
            },
          })
        })

        await prisma.securityLog.create({
          data: {
            userId: adminId,
            action: "ADMIN_CANCEL_ORDER",
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            details: `Cancelou pedido #${orderId} e reembolsou R$ ${refundAmount.toFixed(2)} ao usuário #${order.userId}`,
            severity: "WARN",
          },
        })

        return NextResponse.json({ success: true, refundAmount })
      }

      case "refund": {
        if (!orderId) {
          return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { user: true },
        })

        if (!order) {
          return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
        }

        const refundAmount = Number(order.amount)

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "REFUNDED" },
          })

          const currentBalance = Number(order.user.balance)
          const newBalance = currentBalance + refundAmount

          await tx.user.update({
            where: { id: order.userId },
            data: { balance: newBalance },
          })

          await tx.balanceLog.create({
            data: {
              userId: order.userId,
              amount: refundAmount,
              balanceAfter: newBalance,
              type: "REFUND",
              description: `Reembolso manual admin - Pedido #${orderId}`,
              adminId,
            },
          })
        })

        await prisma.securityLog.create({
          data: {
            userId: adminId,
            action: "ADMIN_REFUND_ORDER",
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            details: `Reembolsou pedido #${orderId}: R$ ${refundAmount.toFixed(2)} ao usuário #${order.userId}`,
            severity: "WARN",
          },
        })

        return NextResponse.json({ success: true, refundAmount })
      }

      case "resend": {
        if (!orderId) {
          return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 })
        }

        const result = await ProviderManager.sendOrderToProvider(orderId)

        await prisma.securityLog.create({
          data: {
            userId: adminId,
            action: "ADMIN_RESEND_ORDER",
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            details: `Reenviou pedido #${orderId} ao provedor. Novo ID: ${result.orderId}`,
            severity: "INFO",
          },
        })

        return NextResponse.json({ success: true, result })
      }

      case "bulk-sync": {
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
          return NextResponse.json(
            { error: "orderIds é obrigatório (array)" },
            { status: 400 }
          )
        }

        const results: Array<{ orderId: number; status?: string; error?: string }> = []

        for (const oid of orderIds.slice(0, 50)) {
          try {
            const result = await ProviderManager.syncOrder(oid)
            if (result) {
              results.push({ orderId: oid, status: result.status })
            } else {
              results.push({ orderId: oid, error: "Sem ID do provedor" })
            }
          } catch (err) {
            results.push({ orderId: oid, error: String(err) })
          }
        }

        await prisma.securityLog.create({
          data: {
            userId: adminId,
            action: "ADMIN_BULK_SYNC",
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            details: `Sync em massa de ${orderIds.length} pedidos`,
            severity: "INFO",
          },
        })

        return NextResponse.json({ success: true, results })
      }

      default:
        return NextResponse.json(
          { error: "Ação inválida" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Admin order action error:", error)
    const message =
      error instanceof Error ? error.message : "Erro ao executar ação"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
