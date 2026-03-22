import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

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
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get("tab") || "info"

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        affiliateCode: true,
        createdAt: true,
        updatedAt: true,
        referredBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            orders: true,
            payments: true,
            referrals: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const result: Record<string, unknown> = {
      user: {
        ...user,
        balance: Number(user.balance),
        totalSpent: Number(user.totalSpent),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    }

    if (tab === "orders") {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      result.orders = orders.map((o) => ({
        id: o.id,
        service: o.service.name,
        link: o.link,
        quantity: o.quantity,
        amount: Number(o.amount),
        cost: Number(o.cost),
        profit: Number(o.profit),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      }))
    }

    if (tab === "payments") {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      })
      result.payments = payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
      }))
    }

    if (tab === "affiliates") {
      const referrals = await prisma.user.findMany({
        where: { referredById: userId },
        select: {
          id: true,
          name: true,
          email: true,
          totalSpent: true,
          createdAt: true,
        },
        take: 50,
      })

      const earnings = await prisma.affiliateEarning.findMany({
        where: { affiliateId: userId },
        include: {
          referredUser: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      const totalEarnings = await prisma.affiliateEarning.aggregate({
        where: { affiliateId: userId, status: "PAID" },
        _sum: { amount: true },
      })

      result.affiliates = {
        referrals: referrals.map((r) => ({
          ...r,
          totalSpent: Number(r.totalSpent),
          createdAt: r.createdAt.toISOString(),
        })),
        earnings: earnings.map((e) => ({
          id: e.id,
          referredUser: e.referredUser.name || e.referredUser.email,
          amount: Number(e.amount),
          percentage: Number(e.percentage),
          status: e.status,
          createdAt: e.createdAt.toISOString(),
        })),
        totalEarnings: Number(totalEarnings._sum.amount) || 0,
      }
    }

    if (tab === "balance") {
      const balanceLogs = await prisma.balanceLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      result.balanceLogs = balanceLogs.map((l) => ({
        id: l.id,
        amount: Number(l.amount),
        balanceAfter: Number(l.balanceAfter),
        type: l.type,
        description: l.description,
        adminId: l.adminId,
        createdAt: l.createdAt.toISOString(),
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin user detail error:", error)
    return NextResponse.json(
      { error: "Erro ao carregar detalhes do usuário" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { role, status } = body

    const allowedRoles = ["USER", "RESELLER", "ADMIN"]
    const allowedStatuses = ["ACTIVE", "BANNED"]

    const updateData: Record<string, string> = {}

    if (role && allowedRoles.includes(role)) {
      updateData.role = role
    }

    if (status && allowedStatuses.includes(status)) {
      updateData.status = status
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado válido para atualizar" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
      },
    })

    // Log the action
    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_USER_UPDATE",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Admin atualizou usuário #${userId}: ${JSON.stringify(updateData)}`,
        severity: "WARN",
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}
