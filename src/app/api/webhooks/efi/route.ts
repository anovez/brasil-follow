import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const AFFILIATE_COMMISSION_PERCENT = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // EFI sends an array of pix payments in the "pix" field
    const pixPayments = body?.pix
    if (!Array.isArray(pixPayments) || pixPayments.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'webhook'
    const userAgent = request.headers.get('user-agent') || 'efi-webhook'

    for (const pix of pixPayments) {
      const txid = pix.txid
      const e2eId = pix.endToEndId
      const paidAmount = parseFloat(pix.valor)

      if (!txid || !e2eId || isNaN(paidAmount) || paidAmount <= 0) {
        continue
      }

      // Find the payment by txId
      const payment = await prisma.payment.findFirst({
        where: { efiTxId: txid },
      })

      if (!payment) {
        await prisma.securityLog.create({
          data: {
            action: 'WEBHOOK_PAYMENT_NOT_FOUND',
            ip,
            userAgent,
            details: `PIX webhook received for unknown txid: ${txid}`,
            severity: 'WARN',
          },
        })
        continue
      }

      // Idempotent: only process if status is still PENDING
      const updated = await prisma.payment.updateMany({
        where: {
          id: payment.id,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          efiE2eId: e2eId,
          paidAt: new Date(),
        },
      })

      // If no rows affected, payment was already processed
      if (updated.count === 0) {
        continue
      }

      // Credit user balance in a transaction
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: payment.userId } })
        if (!user) return

        const creditAmount = paidAmount
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

        // Handle affiliate earnings if user was referred
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
                  description: `Comissão de afiliado - depósito de ${user.username} (R$ ${creditAmount.toFixed(2)})`,
                },
              })
            }
          }
        }

        // Log the successful webhook processing
        await tx.securityLog.create({
          data: {
            userId: user.id,
            action: 'PAYMENT_APPROVED_WEBHOOK',
            ip,
            userAgent,
            details: `PIX payment approved via webhook: txid=${txid}, e2eId=${e2eId}, amount=R$ ${creditAmount.toFixed(2)}`,
            severity: 'INFO',
          },
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('EFI webhook error:', error)
    // Always return 200 to prevent EFI from retrying endlessly
    return NextResponse.json({ ok: true })
  }
}
