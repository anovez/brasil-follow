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
    const status = searchParams.get("status") || "ALL"
    const search = searchParams.get("search") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status !== "ALL") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { user: { OR: [{ name: { contains: search } }, { email: { contains: search } }] } },
      ]
    }

    // Stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const twentyFourHoursAgo = new Date(now)
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const [openCount, waitingCount, closedTodayCount] = await Promise.all([
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "WAITING" } }),
      prisma.ticket.count({ where: { status: "CLOSED", updatedAt: { gte: todayStart } } }),
    ])

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, username: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { message: true, isAdmin: true, createdAt: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ])

    const formattedTickets = tickets.map((t) => {
      const lastMsg = t.messages[0]
      const isUrgent = t.status === "OPEN" && t.updatedAt < twentyFourHoursAgo
      return {
        id: t.id,
        user: {
          id: t.user.id,
          name: t.user.name,
          email: t.user.email,
          username: t.user.username,
        },
        subject: t.subject,
        status: t.status,
        isUrgent,
        lastMessage: lastMsg
          ? {
              text: lastMsg.message.length > 100 ? lastMsg.message.slice(0, 100) + "..." : lastMsg.message,
              isAdmin: lastMsg.isAdmin,
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      tickets: formattedTickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        open: openCount,
        waiting: waitingCount,
        closedToday: closedTodayCount,
      },
    })
  } catch (error) {
    console.error("Admin tickets error:", error)
    return NextResponse.json({ error: "Erro ao carregar tickets" }, { status: 500 })
  }
}
