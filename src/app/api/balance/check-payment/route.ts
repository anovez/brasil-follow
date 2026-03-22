import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { checkPixPayment } from '@/lib/efi'

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`check-payment:${ip}`, RATE_LIMITS.general)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento é obrigatório' }, { status: 400 })
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: parseInt(paymentId, 10),
        userId,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // If already approved, return immediately
    if (payment.status === 'APPROVED') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'APPROVED',
          amount: Number(payment.amount),
          paidAt: payment.paidAt,
        },
      })
    }

    // If expired, return expired status
    if (payment.expiresAt && new Date() > payment.expiresAt) {
      if (payment.status === 'PENDING') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'EXPIRED' },
        })
      }
      return NextResponse.json({
        success: true,
        data: { status: 'EXPIRED' },
      })
    }

    // Check with EFI
    if (payment.efiTxId) {
      const pixStatus = await checkPixPayment(payment.efiTxId)

      if (pixStatus.paid && pixStatus.paidAmount) {
        // Update payment and credit user balance in a transaction
        await prisma.$transaction(async (tx: any) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'APPROVED',
              efiE2eId: pixStatus.e2eId,
              paidAt: new Date(),
            },
          })

          const user = await tx.user.findUnique({ where: { id: userId } })
          if (!user) throw new Error('User not found')

          const newBalance = parseFloat((Number(user.balance) + pixStatus.paidAmount!).toFixed(2))

          await tx.user.update({
            where: { id: userId },
            data: { balance: newBalance },
          })

          await tx.balanceLog.create({
            data: {
              userId,
              amount: pixStatus.paidAmount!,
              balanceAfter: newBalance,
              type: 'DEPOSIT',
              description: `Depósito PIX - Pagamento #${payment.id}`,
            },
          })
        })

        return NextResponse.json({
          success: true,
          data: {
            status: 'APPROVED',
            amount: pixStatus.paidAmount,
            paidAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: payment.status,
      },
    })
  } catch (error) {
    console.error('Check payment error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar pagamento' },
      { status: 500 }
    )
  }
}
