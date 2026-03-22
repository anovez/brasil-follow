import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { addFundsSchema } from '@/lib/validations'
import { createPixCharge } from '@/lib/efi'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`add-funds:${ip}`, RATE_LIMITS.addFunds)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const body = await request.json()

    const parsed = addFundsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { amount } = parsed.data

    if (amount > 10000) {
      return NextResponse.json(
        { error: 'Valor máximo é R$ 10.000,00' },
        { status: 400 }
      )
    }

    // Check for existing pending payments
    const existingPending = await prisma.payment.findFirst({
      where: {
        userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    })

    if (existingPending) {
      return NextResponse.json({
        success: true,
        data: {
          paymentId: existingPending.id,
          amount: Number(existingPending.amount),
          pixCopiaECola: existingPending.pixCopiaECola,
          qrCodeBase64: existingPending.qrCodeBase64,
          expiresAt: existingPending.expiresAt,
        },
      })
    }

    // Create PIX charge via EFI
    const pixData = await createPixCharge(amount, `Depósito Brasil Follow - Usuário #${userId}`)

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        method: 'PIX',
        status: 'PENDING',
        efiTxId: pixData.txid,
        pixCopiaECola: pixData.pixCopiaECola,
        qrCodeBase64: pixData.qrCodeBase64,
        expiresAt: pixData.expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        amount: Number(payment.amount),
        pixCopiaECola: pixData.pixCopiaECola,
        qrCodeBase64: pixData.qrCodeBase64,
        expiresAt: pixData.expiresAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Add funds error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar pagamento PIX. Tente novamente.' },
      { status: 500 }
    )
  }
}
