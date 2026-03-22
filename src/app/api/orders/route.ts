import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { createOrderSchema, urlSafetyCheck } from '@/lib/validations'
import { calculateLevelDiscount } from '@/lib/utils'
import { ProviderManager } from '@/lib/providers/provider-manager'

const AFFILIATE_ORDER_COMMISSION_PERCENT = 3

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`orders-list:${ip}`, RATE_LIMITS.general)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (status) {
      const validStatuses = ['PENDING', 'PROCESSING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'CANCELLED', 'REFUNDED', 'ERROR']
      if (validStatuses.includes(status)) {
        where.status = status
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: orders.map(order => ({
          id: order.id,
          externalId: order.externalId,
          service: order.service.name,
          category: order.service.category.name,
          link: order.link,
          quantity: order.quantity,
          amount: Number(order.amount),
          status: order.status,
          startCount: order.startCount,
          remains: order.remains,
          createdAt: order.createdAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`create-order:${ip}`, RATE_LIMITS.createOrder)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const body = await request.json()

    // Validate input
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: (parsed.error.issues || [])[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { serviceId, link, quantity } = parsed.data

    // URL safety check
    const urlCheck = urlSafetyCheck(link)
    if (!urlCheck.safe) {
      return NextResponse.json(
        { error: urlCheck.reason || 'URL não permitida' },
        { status: 400 }
      )
    }

    // Find service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { provider: true },
    })

    if (!service || !service.isActive) {
      return NextResponse.json(
        { error: 'Serviço não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Validate quantity
    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      return NextResponse.json(
        { error: `Quantidade deve ser entre ${service.minQuantity} e ${service.maxQuantity}` },
        { status: 400 }
      )
    }

    // Get user for level discount and balance check
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Calculate amount with level discount
    const pricePerUnit = Number(service.pricePerThousand) / 1000
    const baseAmount = pricePerUnit * quantity
    const discountPercent = calculateLevelDiscount(user.level)
    const discountAmount = baseAmount * (discountPercent / 100)
    const finalAmount = parseFloat((baseAmount - discountAmount).toFixed(2))

    // Calculate cost
    const costPerUnit = Number(service.costPerThousand) / 1000
    const cost = parseFloat((costPerUnit * quantity).toFixed(2))
    const profit = parseFloat((finalAmount - cost).toFixed(2))

    // Check balance and create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Re-fetch user inside transaction for consistent balance
      const txUser = await tx.user.findUnique({ where: { id: userId } })
      if (!txUser) throw new Error('Usuário não encontrado')

      const currentBalance = Number(txUser.balance)
      if (currentBalance < finalAmount) {
        throw new Error('INSUFFICIENT_BALANCE')
      }

      // Debit balance
      const newBalance = parseFloat((currentBalance - finalAmount).toFixed(2))
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      })

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          serviceId,
          link,
          quantity,
          amount: finalAmount,
          cost,
          profit,
          status: 'PENDING',
        },
      })

      // Create balance log
      await tx.balanceLog.create({
        data: {
          userId,
          amount: -finalAmount,
          balanceAfter: newBalance,
          type: 'ORDER',
          description: `Pedido #${newOrder.id} - ${service.name} (${quantity} un.)`,
        },
      })

      // Handle affiliate earning on order
      if (txUser.referredById) {
        const affiliateAmount = parseFloat((finalAmount * (AFFILIATE_ORDER_COMMISSION_PERCENT / 100)).toFixed(2))
        if (affiliateAmount > 0) {
          const affiliate = await tx.user.findUnique({ where: { id: txUser.referredById } })
          if (affiliate) {
            const newAffiliateBalance = parseFloat((Number(affiliate.balance) + affiliateAmount).toFixed(2))

            await tx.user.update({
              where: { id: affiliate.id },
              data: { balance: newAffiliateBalance },
            })

            await tx.affiliateEarning.create({
              data: {
                affiliateId: affiliate.id,
                referredUserId: userId,
                orderId: newOrder.id,
                amount: affiliateAmount,
                percentage: AFFILIATE_ORDER_COMMISSION_PERCENT,
                status: 'APPROVED',
              },
            })

            await tx.balanceLog.create({
              data: {
                userId: affiliate.id,
                amount: affiliateAmount,
                balanceAfter: newAffiliateBalance,
                type: 'AFFILIATE',
                description: `Comissão de afiliado - pedido #${newOrder.id} de ${txUser.username}`,
              },
            })
          }
        }
      }

      return newOrder
    })

    // Send order to provider (outside transaction to avoid long locks)
    try {
      await ProviderManager.sendOrderToProvider(order.id)
    } catch (providerError) {
      console.error(`Failed to send order ${order.id} to provider:`, providerError)
      // Order stays as PENDING, will be retried or handled manually
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'ERROR' },
      })
    }

    // Fetch updated order
    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        service: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: createdOrder!.id,
        externalId: createdOrder!.externalId,
        service: createdOrder!.service.name,
        link: createdOrder!.link,
        quantity: createdOrder!.quantity,
        amount: Number(createdOrder!.amount),
        status: createdOrder!.status,
        createdAt: createdOrder!.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json(
        { error: 'Saldo insuficiente. Adicione fundos para continuar.' },
        { status: 400 }
      )
    }
    console.error('Orders POST error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
