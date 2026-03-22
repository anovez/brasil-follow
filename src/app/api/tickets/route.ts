import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { createTicketSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`tickets-list:${ip}`, RATE_LIMITS.general)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: tickets.map((t: any) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        messageCount: t._count.messages,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Tickets GET error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`create-ticket:${ip}`, RATE_LIMITS.createOrder)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const body = await request.json()

    const parsed = createTicketSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { subject, message } = parsed.data

    // Check for too many open tickets
    const openTickets = await prisma.ticket.count({
      where: { userId, status: { in: ['OPEN', 'CUSTOMER_REPLY'] } },
    })

    if (openTickets >= 5) {
      return NextResponse.json(
        { error: 'Você atingiu o limite de 5 tickets abertos. Aguarde o atendimento dos tickets existentes.' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        subject,
        status: 'OPEN',
        messages: {
          create: {
            userId,
            message,
            isAdmin: false,
          },
        },
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Tickets POST error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
