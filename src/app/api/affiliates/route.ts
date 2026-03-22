import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`affiliates:${ip}`, RATE_LIMITS.general)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        affiliateCode: true,
        referrals: {
          select: {
            id: true,
            username: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Get earnings
    const earnings = await prisma.affiliateEarning.findMany({
      where: { affiliateId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        referredUser: {
          select: { username: true },
        },
      },
    })

    // Aggregate stats
    const totalEarned = earnings
      .filter((e: typeof earnings[0]) => e.status === 'APPROVED')
      .reduce((sum: number, e: typeof earnings[0]) => sum + Number(e.amount), 0)

    const pendingEarnings = earnings
      .filter((e: typeof earnings[0]) => e.status === 'PENDING')
      .reduce((sum: number, e: typeof earnings[0]) => sum + Number(e.amount), 0)

    return NextResponse.json({
      success: true,
      data: {
        affiliateCode: user.affiliateCode,
        totalReferrals: user.referrals.length,
        totalEarned,
        pendingEarnings,
        referrals: user.referrals.map((r: typeof user.referrals[0]) => ({
          id: r.id,
          username: r.username.substring(0, 3) + '***',
          joinedAt: r.createdAt,
        })),
        earnings: earnings.map((e: typeof earnings[0]) => ({
          id: e.id,
          referredUser: e.referredUser.username.substring(0, 3) + '***',
          amount: Number(e.amount),
          percentage: Number(e.percentage),
          status: e.status,
          createdAt: e.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Affiliates error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
