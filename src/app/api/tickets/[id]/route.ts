import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`ticket-detail:${ip}`, RATE_LIMITS.general)
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

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { name: true, role: true },
            },
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        messages: ticket.messages.map((m: any) => ({
          id: m.id,
          message: m.message,
          isAdmin: m.isAdmin,
          userName: m.user.name,
          userRole: m.user.role,
          createdAt: m.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Ticket GET error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
