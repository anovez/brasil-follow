import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const twentyFourHoursAgo = new Date(now)
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Revenue & cost for today/week/month
    const [ordersToday, ordersWeek, ordersMonth] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { amount: true, cost: true, profit: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: weekStart } },
        _sum: { amount: true, cost: true, profit: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { amount: true, cost: true, profit: true },
        _count: true,
      }),
    ])

    // Active orders count
    const activeOrders = await prisma.order.count({
      where: { status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] } },
    })

    // New users today
    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: todayStart } },
    })

    // Provider balances
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: { id: true, name: true, balance: true, currency: true },
    })
    const totalProviderBalance = providers.reduce(
      (sum, p) => sum + Number(p.balance),
      0
    )

    // Revenue chart data (last 30 days)
    const chartOrders = await prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, profit: true, createdAt: true },
    })

    const chartDataMap = new Map<string, { revenue: number; profit: number }>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      chartDataMap.set(key, { revenue: 0, profit: 0 })
    }
    for (const order of chartOrders) {
      const key = order.createdAt.toISOString().slice(0, 10)
      const entry = chartDataMap.get(key)
      if (entry) {
        entry.revenue += Number(order.amount)
        entry.profit += Number(order.profit)
      }
    }
    const revenueChart = Array.from(chartDataMap.entries()).map(
      ([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        profit: Math.round(data.profit * 100) / 100,
      })
    )

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    })

    const statusColors: Record<string, string> = {
      PENDING: "#f59e0b",
      PROCESSING: "#3b82f6",
      IN_PROGRESS: "#6c5ce7",
      COMPLETED: "#10b981",
      PARTIAL: "#f97316",
      CANCELLED: "#ef4444",
      FAILED: "#dc2626",
      REFUNDED: "#8b5cf6",
    }

    const orderStatusChart = ordersByStatus.map((s) => ({
      name: s.status,
      value: s._count,
      color: statusColors[s.status] || "#6b7280",
    }))

    // Last 10 orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
      },
    })

    const formattedRecentOrders = recentOrders.map((o) => ({
      id: o.id,
      user: o.user.name || o.user.email,
      service: o.service.name,
      link: o.link,
      quantity: o.quantity,
      amount: Number(o.amount),
      cost: Number(o.cost),
      profit: Number(o.profit),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }))

    // Alerts
    const alerts: Array<{
      type: "danger" | "warning" | "info"
      title: string
      message: string
    }> = []

    // Low balance providers
    const lowBalanceProviders = providers.filter(
      (p) => Number(p.balance) < 50
    )
    if (lowBalanceProviders.length > 0) {
      alerts.push({
        type: "danger",
        title: "Saldo baixo em provedores",
        message: lowBalanceProviders
          .map((p) => `${p.name}: R$ ${Number(p.balance).toFixed(2)}`)
          .join(", "),
      })
    }

    // Unanswered tickets > 24h
    const oldTickets = await prisma.ticket.findMany({
      where: {
        status: "OPEN",
        updatedAt: { lt: twentyFourHoursAgo },
      },
      select: { id: true, subject: true, updatedAt: true },
    })
    if (oldTickets.length > 0) {
      alerts.push({
        type: "warning",
        title: `${oldTickets.length} ticket(s) sem resposta > 24h`,
        message: oldTickets
          .slice(0, 5)
          .map((t) => `#${t.id} - ${t.subject}`)
          .join(", "),
      })
    }

    // Failed orders last 24h
    const failedOrders = await prisma.order.count({
      where: {
        status: { in: ["FAILED", "CANCELLED"] },
        updatedAt: { gte: twentyFourHoursAgo },
      },
    })
    if (failedOrders > 0) {
      alerts.push({
        type: "warning",
        title: `${failedOrders} pedido(s) falharam nas últimas 24h`,
        message: "Verifique a página de pedidos para mais detalhes.",
      })
    }

    return NextResponse.json({
      revenue: {
        today: Number(ordersToday._sum.amount) || 0,
        week: Number(ordersWeek._sum.amount) || 0,
        month: Number(ordersMonth._sum.amount) || 0,
      },
      cost: {
        today: Number(ordersToday._sum.cost) || 0,
        week: Number(ordersWeek._sum.cost) || 0,
        month: Number(ordersMonth._sum.cost) || 0,
      },
      profit: {
        today: Number(ordersToday._sum.profit) || 0,
        week: Number(ordersWeek._sum.profit) || 0,
        month: Number(ordersMonth._sum.profit) || 0,
      },
      activeOrders,
      newUsersToday,
      totalProviderBalance,
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        balance: Number(p.balance),
        currency: p.currency,
      })),
      revenueChart,
      orderStatusChart,
      recentOrders: formattedRecentOrders,
      alerts,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Erro ao carregar estatísticas" },
      { status: 500 }
    )
  }
}
