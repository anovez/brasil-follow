import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import crypto from 'crypto'

function generateApiKey(): string {
  return `bf_${crypto.randomBytes(24).toString('hex')}`
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`regen-api-key:${ip}`, RATE_LIMITS.addFunds)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)

    const newApiKey = generateApiKey()

    await prisma.user.update({
      where: { id: userId },
      data: { apiKey: newApiKey },
    })

    return NextResponse.json({
      success: true,
      data: {
        apiKey: newApiKey,
      },
    })
  } catch (error) {
    console.error('Regenerate API key error:', error)
    return NextResponse.json(
      { error: 'Erro ao regenerar chave da API' },
      { status: 500 }
    )
  }
}
