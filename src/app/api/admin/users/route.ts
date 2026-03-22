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
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "ALL"
    const status = searchParams.get("status") || "ALL"
    const level = searchParams.get("level") || "ALL"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
        { name: { contains: search } },
      ]
    }

    if (role !== "ALL") {
      where.role = role
    }

    if (status !== "ALL") {
      where.status = status
    }

    if (level !== "ALL") {
      where.level = level
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          role: true,
          status: true,
          level: true,
          balance: true,
          totalSpent: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              payments: true,
              referrals: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      image: u.image,
      role: u.role,
      status: u.status,
      level: u.level,
      balance: Number(u.balance),
      totalSpent: Number(u.totalSpent),
      createdAt: u.createdAt.toISOString(),
      ordersCount: u._count.orders,
      paymentsCount: u._count.payments,
      referralsCount: u._count.referrals,
    }))

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    )
  }
}
