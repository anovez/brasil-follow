import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const adminId = Number(session.user.id)
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { id } = await params
    const ticketId = parseInt(id)

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { message, closeTicket } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 })
    }

    const newStatus = closeTicket ? "CLOSED" : "WAITING"

    const [ticketMessage] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId,
          userId: adminId,
          message: message.trim(),
          isAdmin: true,
        },
        include: {
          user: { select: { id: true, name: true, role: true, image: true } },
        },
      }),
      prisma.ticket.update({
        where: { id: ticketId },
        data: { status: newStatus },
      }),
    ])

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: closeTicket ? "ADMIN_CLOSE_TICKET" : "ADMIN_REPLY_TICKET",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `${closeTicket ? "Respondeu e fechou" : "Respondeu"} ticket #${ticketId}`,
        severity: "INFO",
      },
    })

    return NextResponse.json({
      success: true,
      message: {
        id: ticketMessage.id,
        message: ticketMessage.message,
        isAdmin: ticketMessage.isAdmin,
        user: {
          id: ticketMessage.user.id,
          name: ticketMessage.user.name,
          role: ticketMessage.user.role,
          image: ticketMessage.user.image,
        },
        createdAt: ticketMessage.createdAt.toISOString(),
      },
      newStatus,
    })
  } catch (error) {
    console.error("Admin ticket reply error:", error)
    return NextResponse.json({ error: "Erro ao responder ticket" }, { status: 500 })
  }
}
