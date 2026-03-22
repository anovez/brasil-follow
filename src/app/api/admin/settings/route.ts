import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

async function verifyAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const adminId = Number(session.user.id)
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  })
  if (!admin || admin.role !== "ADMIN") return null
  return adminId
}

const SENSITIVE_KEYS = [
  "efi_client_secret",
  "efi_pix_cert",
  "smtp_password",
  "cron_secret",
  "google_client_secret",
]

function maskValue(key: string, value: string): string {
  if (SENSITIVE_KEYS.includes(key) && value.length > 4) {
    return value.slice(0, 4) + "*".repeat(Math.min(value.length - 4, 20))
  }
  return value
}

export async function GET() {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    })

    const formatted: Record<string, string> = {}
    for (const s of settings) {
      formatted[s.key] = maskValue(s.key, s.value)
    }

    return NextResponse.json({ settings: formatted })
  } catch (error) {
    console.error("Admin settings GET error:", error)
    return NextResponse.json({ error: "Erro ao carregar configurações" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "settings é obrigatório" }, { status: 400 })
    }

    const updatedKeys: string[] = []

    for (const [key, value] of Object.entries(settings)) {
      const strValue = String(value)

      // Skip masked values (unchanged sensitive fields)
      if (SENSITIVE_KEYS.includes(key) && strValue.includes("****")) {
        continue
      }

      await prisma.setting.upsert({
        where: { key },
        update: { value: strValue },
        create: { key, value: strValue },
      })
      updatedKeys.push(key)
    }

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_UPDATE_SETTINGS",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Atualizou configurações: ${updatedKeys.join(", ")}`,
        severity: "WARN",
      },
    })

    return NextResponse.json({ success: true, updated: updatedKeys.length })
  } catch (error) {
    console.error("Admin settings PUT error:", error)
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 })
  }
}
