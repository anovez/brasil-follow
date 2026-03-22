import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { ticketReplySchema } from '@/lib/validations'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`ticket-reply:${ip}`, RATE_LIMITS.createOrder)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const { id } = await params
    const ticketId = parseInt(id, 10)

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = ticketReplySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Verify ownership
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    if (ticket.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Este ticket está fechado. Abra um novo ticket se precisar de ajuda.' },
        { status: 400 }
      )
    }

    const { message } = parsed.data

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message,
        isAdmin: false,
      },
    })

    // Update ticket status to CUSTOMER_REPLY
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CUSTOMER_REPLY' },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: ticketMessage.id,
        message: ticketMessage.message,
        isAdmin: ticketMessage.isAdmin,
        createdAt: ticketMessage.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Ticket reply error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
