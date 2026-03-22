import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

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
    const period = searchParams.get("period") || "30d"

    const now = new Date()
    let startDate: Date

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "7d":
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case "90d":
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 90)
        break
      case "30d":
      default:
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        break
    }

    // Custom date range
    const customFrom = searchParams.get("from")
    const customTo = searchParams.get("to")
    if (customFrom) {
      startDate = new Date(customFrom)
    }
    const endDate = customTo ? new Date(customTo) : now

    // Aggregate stats
    const [orderStats, paymentStats, newUsers, totalOrders] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true, cost: true, profit: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          status: { in: ["PAID", "APPROVED"] },
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
    ])

    const revenue = Number(orderStats._sum.amount) || 0
    const cost = Number(orderStats._sum.cost) || 0
    const profit = Number(orderStats._sum.profit) || 0
    const avgTicket = totalOrders > 0 ? revenue / totalOrders : 0
    const avgDeposit = Number(paymentStats._avg.amount) || 0
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    // Daily data for charts
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const days = Math.max(1, daysDiff)

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { amount: true, cost: true, profit: true, createdAt: true, service: { select: { name: true, categoryId: true, category: { select: { name: true } } } } },
    })

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    })

    // Build daily maps
    const dailyRevenue = new Map<string, { revenue: number; cost: number; profit: number; orders: number }>()
    const dailyUsers = new Map<string, number>()

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      dailyRevenue.set(key, { revenue: 0, cost: 0, profit: 0, orders: 0 })
      dailyUsers.set(key, 0)
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10)
      const entry = dailyRevenue.get(key)
      if (entry) {
        entry.revenue += Number(order.amount)
        entry.cost += Number(order.cost)
        entry.profit += Number(order.profit)
        entry.orders++
      }
    }

    for (const user of users) {
      const key = user.createdAt.toISOString().slice(0, 10)
      const count = dailyUsers.get(key) || 0
      dailyUsers.set(key, count + 1)
    }

    const revenueChart = Array.from(dailyRevenue.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      cost: Math.round(data.cost * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
    }))

    const ordersPerDayChart = Array.from(dailyRevenue.entries()).map(([date, data]) => ({
      date,
      orders: data.orders,
    }))

    const usersPerDayChart = Array.from(dailyUsers.entries()).map(([date, count]) => ({
      date,
      users: count,
    }))

    // Orders by social network (derive from category name)
    const categoryCount = new Map<string, number>()
    for (const order of orders) {
      const catName = order.service.category.name
      categoryCount.set(catName, (categoryCount.get(catName) || 0) + 1)
    }

    const socialColors = ["#6c5ce7", "#e84393", "#00cec9", "#fdcb6e", "#e17055", "#0984e3", "#00b894", "#a29bfe"]
    const ordersBySocialChart = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: socialColors[i % socialColors.length],
      }))

    // Top 10 services by volume
    const serviceVolume = new Map<string, { count: number; revenue: number; profit: number }>()
    for (const order of orders) {
      const sName = order.service.name
      const existing = serviceVolume.get(sName) || { count: 0, revenue: 0, profit: 0 }
      existing.count++
      existing.revenue += Number(order.amount)
      existing.profit += Number(order.profit)
      serviceVolume.set(sName, existing)
    }

    const topServicesByVolume = Array.from(serviceVolume.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, data]) => ({
        name: name.length > 40 ? name.slice(0, 40) + "..." : name,
        count: data.count,
      }))

    const topServicesByProfit = Array.from(serviceVolume.entries())
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 10)
      .map(([name, data]) => ({
        name: name.length > 40 ? name.slice(0, 40) + "..." : name,
        profit: Math.round(data.profit * 100) / 100,
      }))

    // Top clients
    const topClients = await prisma.order.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true, profit: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    })

    const clientIds = topClients.map((c) => c.userId)
    const clientUsers = await prisma.user.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true, username: true },
    })
    const clientMap = new Map(clientUsers.map((u) => [u.id, u]))

    const topClientsFormatted = topClients.map((c) => {
      const user = clientMap.get(c.userId)
      return {
        userId: c.userId,
        name: user?.name || "N/A",
        email: user?.email || "",
        username: user?.username || "",
        ordersCount: c._count,
        totalSpent: Number(c._sum.amount) || 0,
        profit: Number(c._sum.profit) || 0,
      }
    })

    return NextResponse.json({
      stats: {
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        newUsers,
        totalOrders,
        avgTicket: Math.round(avgTicket * 100) / 100,
        avgDeposit: Math.round(avgDeposit * 100) / 100,
      },
      charts: {
        revenueChart,
        ordersPerDayChart,
        ordersBySocialChart,
        topServicesByVolume,
        topServicesByProfit,
        usersPerDayChart,
      },
      topClients: topClientsFormatted,
    })
  } catch (error) {
    console.error("Admin statistics error:", error)
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 })
  }
}
