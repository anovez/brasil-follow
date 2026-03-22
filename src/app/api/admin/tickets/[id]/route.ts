import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
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

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true, username: true, image: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, role: true, image: true } },
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        user: ticket.user,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        messages: ticket.messages.map((m) => ({
          id: m.id,
          message: m.message,
          isAdmin: m.isAdmin,
          user: {
            id: m.user.id,
            name: m.user.name,
            role: m.user.role,
            image: m.user.image,
          },
          createdAt: m.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error("Admin ticket detail error:", error)
    return NextResponse.json({ error: "Erro ao carregar ticket" }, { status: 500 })
  }
}
