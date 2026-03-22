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
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { amount, description, action } = body

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Valor inválido. Deve ser um número positivo." },
        { status: 400 }
      )
    }

    if (!description || typeof description !== "string" || description.trim().length < 3) {
      return NextResponse.json(
        { error: "Descrição é obrigatória (mínimo 3 caracteres)." },
        { status: 400 }
      )
    }

    if (!action || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Ação inválida. Use 'add' ou 'remove'." },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    const balanceChange = action === "add" ? parsedAmount : -parsedAmount

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, balance: true },
      })

      if (!user) {
        throw new Error("Usuário não encontrado")
      }

      const currentBalance = Number(user.balance)
      const newBalance = currentBalance + balanceChange

      if (newBalance < 0) {
        throw new Error(
          `Saldo insuficiente. Saldo atual: R$ ${currentBalance.toFixed(2)}, tentando remover: R$ ${parsedAmount.toFixed(2)}`
        )
      }

      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      })

      const log = await tx.balanceLog.create({
        data: {
          userId,
          amount: balanceChange,
          balanceAfter: newBalance,
          type: action === "add" ? "ADMIN_ADD" : "ADMIN_REMOVE",
          description: description.trim(),
          adminId,
        },
      })

      return {
        userId,
        previousBalance: currentBalance,
        newBalance,
        change: balanceChange,
        logId: log.id,
      }
    })

    // Log to security log
    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: action === "add" ? "ADMIN_ADD_BALANCE" : "ADMIN_REMOVE_BALANCE",
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Admin ${action === "add" ? "adicionou" : "removeu"} R$ ${parsedAmount.toFixed(2)} do usuário #${userId}. Motivo: ${description.trim()}. Saldo anterior: R$ ${result.previousBalance.toFixed(2)}, novo saldo: R$ ${result.newBalance.toFixed(2)}`,
        severity: "WARN",
      },
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Admin balance adjustment error:", error)
    const message =
      error instanceof Error ? error.message : "Erro ao ajustar saldo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
