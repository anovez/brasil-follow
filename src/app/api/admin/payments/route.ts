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
    const analysis = searchParams.get("analysis")

    // Profit by service
    if (analysis === "services") {
      const services = await prisma.order.groupBy({
        by: ["serviceId"],
        _sum: { amount: true, cost: true, profit: true },
        _count: true,
        orderBy: { _sum: { profit: "desc" } },
        take: 100,
      })

      const serviceIds = services.map((s) => s.serviceId)
      const serviceNames = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true },
      })
      const nameMap = new Map(serviceNames.map((s) => [s.id, s.name]))

      const formatted = services.map((s) => {
        const revenue = Number(s._sum.amount) || 0
        const cost = Number(s._sum.cost) || 0
        const profit = Number(s._sum.profit) || 0
        return {
          serviceId: s.serviceId,
          serviceName: nameMap.get(s.serviceId) || `Serviço #${s.serviceId}`,
          ordersCount: s._count,
          revenue,
          cost,
          profit,
          margin: revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0,
        }
      })

      return NextResponse.json({ analysis: formatted })
    }

    // Profit by provider
    if (analysis === "providers") {
      const orders = await prisma.order.findMany({
        select: {
          amount: true,
          cost: true,
          profit: true,
          service: {
            select: {
              provider: { select: { id: true, name: true } },
            },
          },
        },
      })

      const providerMap = new Map<
        number,
        { name: string; count: number; revenue: number; cost: number; profit: number }
      >()

      for (const order of orders) {
        const pId = order.service.provider.id
        const pName = order.service.provider.name
        const existing = providerMap.get(pId) || { name: pName, count: 0, revenue: 0, cost: 0, profit: 0 }
        existing.count++
        existing.revenue += Number(order.amount)
        existing.cost += Number(order.cost)
        existing.profit += Number(order.profit)
        providerMap.set(pId, existing)
      }

      const formatted = Array.from(providerMap.entries())
        .map(([id, data]) => ({
          providerId: id,
          providerName: data.name,
          ordersCount: data.count,
          revenue: Math.round(data.revenue * 100) / 100,
          cost: Math.round(data.cost * 100) / 100,
          profit: Math.round(data.profit * 100) / 100,
          margin:
            data.revenue > 0
              ? Math.round((data.profit / data.revenue) * 10000) / 100
              : 0,
        }))
        .sort((a, b) => b.profit - a.profit)

      return NextResponse.json({ analysis: formatted })
    }

    // Default: list payments
    const status = searchParams.get("status") || "ALL"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit
    const format = searchParams.get("format")

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

    // Stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [statsToday, statsWeek, statsMonth, pendingCount, totalPaid, totalCreated] =
      await Promise.all([
        prisma.payment.aggregate({
          where: { status: { in: ["PAID", "APPROVED"] }, paidAt: { gte: todayStart } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payment.aggregate({
          where: { status: { in: ["PAID", "APPROVED"] }, paidAt: { gte: weekStart } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payment.aggregate({
          where: { status: { in: ["PAID", "APPROVED"] }, paidAt: { gte: monthStart } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payment.count({ where: { status: "PENDING" } }),
        prisma.payment.count({ where: { status: { in: ["PAID", "APPROVED"] } } }),
        prisma.payment.count(),
      ])

    // CSV export
    if (format === "csv") {
      const allPayments = await prisma.payment.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 10000,
      })

      const csvHeader = "ID,Usuário,Email,Valor,Método,Status,TxID,Data Criação,Data Pagamento\n"
      const csvRows = allPayments
        .map((p) => {
          const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`
          return [
            p.id,
            esc(p.user.name || ""),
            esc(p.user.email),
            Number(p.amount).toFixed(2),
            p.method,
            p.status,
            esc(p.efiTxId || ""),
            p.createdAt.toISOString(),
            p.paidAt ? p.paidAt.toISOString() : "",
          ].join(",")
        })
        .join("\n")

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    const formattedPayments = payments.map((p) => ({
      id: p.id,
      user: {
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        username: p.user.username,
      },
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      efiTxId: p.efiTxId,
      efiE2eId: p.efiE2eId,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    }))

    return NextResponse.json({
      payments: formattedPayments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        depositedToday: Number(statsToday._sum.amount) || 0,
        depositedWeek: Number(statsWeek._sum.amount) || 0,
        depositedMonth: Number(statsMonth._sum.amount) || 0,
        pendingCount,
        conversionRate:
          totalCreated > 0
            ? Math.round((totalPaid / totalCreated) * 10000) / 100
            : 0,
      },
    })
  } catch (error) {
    console.error("Admin payments error:", error)
    return NextResponse.json({ error: "Erro ao carregar pagamentos" }, { status: 500 })
  }
}
