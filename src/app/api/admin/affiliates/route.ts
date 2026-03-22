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

export async function GET() {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Get all users who have referred someone or have earnings
    const usersWithReferrals = await prisma.user.findMany({
      where: {
        OR: [
          { referrals: { some: {} } },
          { affiliateEarnings: { some: {} } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        affiliateCode: true,
        _count: { select: { referrals: true } },
      },
    })

    const affiliates = []

    for (const user of usersWithReferrals) {
      const earnings = await prisma.affiliateEarning.aggregate({
        where: { affiliateId: user.id },
        _sum: { amount: true },
      })

      const pendingEarnings = await prisma.affiliateEarning.aggregate({
        where: { affiliateId: user.id, status: "PENDING" },
        _sum: { amount: true },
      })

      const paidEarnings = await prisma.affiliateEarning.aggregate({
        where: { affiliateId: user.id, status: "PAID" },
        _sum: { amount: true },
      })

      affiliates.push({
        userId: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        affiliateCode: user.affiliateCode,
        totalReferrals: user._count.referrals,
        totalEarnings: Number(earnings._sum.amount) || 0,
        pendingEarnings: Number(pendingEarnings._sum.amount) || 0,
        paidEarnings: Number(paidEarnings._sum.amount) || 0,
      })
    }

    affiliates.sort((a, b) => b.totalEarnings - a.totalEarnings)

    // Get affiliate program setting
    const affiliateSetting = await prisma.setting.findUnique({
      where: { key: "affiliate_enabled" },
    })
    const affiliateEnabled = affiliateSetting?.value !== "false"

    return NextResponse.json({
      affiliates,
      affiliateEnabled,
    })
  } catch (error) {
    console.error("Admin affiliates GET error:", error)
    return NextResponse.json({ error: "Erro ao carregar afiliados" }, { status: 500 })
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

    if (action === "mark-paid") {
      const { affiliateId } = body
      if (!affiliateId) {
        return NextResponse.json({ error: "affiliateId é obrigatório" }, { status: 400 })
      }

      const updated = await prisma.affiliateEarning.updateMany({
        where: { affiliateId: parseInt(affiliateId), status: "PENDING" },
        data: { status: "PAID" },
      })

      await prisma.securityLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_PAY_AFFILIATE",
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          details: `Marcou ${updated.count} ganhos do afiliado #${affiliateId} como pagos`,
          severity: "INFO",
        },
      })

      return NextResponse.json({ success: true, updated: updated.count })
    }

    if (action === "toggle-program") {
      const { enabled } = body

      await prisma.setting.upsert({
        where: { key: "affiliate_enabled" },
        update: { value: String(enabled) },
        create: { key: "affiliate_enabled", value: String(enabled) },
      })

      await prisma.securityLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_TOGGLE_AFFILIATE",
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          details: `Programa de afiliados ${enabled ? "ativado" : "desativado"}`,
          severity: "WARN",
        },
      })

      return NextResponse.json({ success: true, enabled })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("Admin affiliates POST error:", error)
    return NextResponse.json({ error: "Erro ao executar ação" }, { status: 500 })
  }
}
