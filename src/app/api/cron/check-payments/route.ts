import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkPixPayment } from '@/lib/efi'

const AFFILIATE_COMMISSION_PERCENT = 5

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all PENDING payments that haven't expired
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        method: 'PIX',
        efiTxId: { not: null },
      },
      take: 50,
    })

    const results: Array<{ id: number; status: string; error?: string }> = []

    for (const payment of pendingPayments) {
      try {
        // Check if payment is expired
        if (payment.expiresAt && new Date(payment.expiresAt) < new Date()) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'EXPIRED' },
          })
          results.push({ id: payment.id, status: 'EXPIRED' })
          continue
        }

        // Check payment status with EFI
        const pixStatus = await checkPixPayment(payment.efiTxId!)

        if (pixStatus.paid && pixStatus.paidAmount && pixStatus.paidAmount > 0) {
          // Idempotent: only process if status is still PENDING
          const updated = await prisma.payment.updateMany({
            where: {
              id: payment.id,
              status: 'PENDING',
            },
            data: {
              status: 'APPROVED',
              efiE2eId: pixStatus.e2eId,
              paidAt: new Date(),
            },
          })

          if (updated.count === 0) {
            results.push({ id: payment.id, status: 'ALREADY_PROCESSED' })
            continue
          }

          // Credit user balance in a transaction
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: payment.userId } })
            if (!user) return

            const creditAmount = pixStatus.paidAmount!
            const newBalance = Number(user.balance) + creditAmount

            // Update user balance and totalSpent
            await tx.user.update({
              where: { id: user.id },
              data: {
                balance: newBalance,
                totalSpent: Number(user.totalSpent) + creditAmount,
              },
            })

            // Create balance log entry
            await tx.balanceLog.create({
              data: {
                userId: user.id,
                amount: creditAmount,
                balanceAfter: newBalance,
                type: 'DEPOSIT',
                description: `Depósito PIX aprovado - R$ ${creditAmount.toFixed(2)}`,
              },
            })

            // Handle affiliate earnings
            if (user.referredById) {
              const affiliateAmount = creditAmount * (AFFILIATE_COMMISSION_PERCENT / 100)
              if (affiliateAmount > 0) {
                const affiliate = await tx.user.findUnique({ where: { id: user.referredById } })
                if (affiliate) {
                  const newAffiliateBalance = Number(affiliate.balance) + affiliateAmount

                  await tx.user.update({
                    where: { id: affiliate.id },
                    data: { balance: newAffiliateBalance },
                  })

                  await tx.affiliateEarning.create({
                    data: {
                      affiliateId: affiliate.id,
                      referredUserId: user.id,
                      amount: affiliateAmount,
                      percentage: AFFILIATE_COMMISSION_PERCENT,
                      status: 'APPROVED',
                    },
                  })

                  await tx.balanceLog.create({
                    data: {
                      userId: affiliate.id,
                      amount: affiliateAmount,
                      balanceAfter: newAffiliateBalance,
                      type: 'AFFILIATE',
                      description: `Comissão de afiliado - depósito de usuário #${user.id} (R$ ${creditAmount.toFixed(2)})`,
                    },
                  })
                }
              }
            }

            // Security log
            await tx.securityLog.create({
              data: {
                userId: user.id,
                action: 'PAYMENT_APPROVED_CRON',
                ip: 'cron',
                details: `PIX payment approved via cron check: txid=${payment.efiTxId}, amount=R$ ${creditAmount.toFixed(2)}`,
                severity: 'INFO',
              },
            })
          })

          results.push({ id: payment.id, status: 'APPROVED' })
        } else if (pixStatus.status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REJECTED' },
          })
          results.push({ id: payment.id, status: 'REJECTED' })
        } else {
          results.push({ id: payment.id, status: 'STILL_PENDING' })
        }
      } catch (error) {
        results.push({ id: payment.id, status: 'ERROR', error: String(error) })
      }
    }

    const summary = {
      total: results.length,
      approved: results.filter(r => r.status === 'APPROVED').length,
      expired: results.filter(r => r.status === 'EXPIRED').length,
      stillPending: results.filter(r => r.status === 'STILL_PENDING').length,
      errors: results.filter(r => r.status === 'ERROR').length,
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
    })
  } catch (error) {
    console.error('Check payments cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
