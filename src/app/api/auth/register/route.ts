import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit"

function generateAffiliateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase()
}

function generateApiKey(): string {
  return `bf_${crypto.randomBytes(24).toString("hex")}`
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"

    // Rate limiting
    const rateLimitResult = checkRateLimit(`register:${ip}`, RATE_LIMITS.register)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.retryAfter)
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const issues = parsed.error.issues || (parsed.error as any).errors || []
      const firstError = issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Dados invalidos" },
        { status: 400 }
      )
    }

    const { name, email, username, password } = parsed.data
    const normalizedEmail = email.toLowerCase()
    const normalizedUsername = username.toLowerCase()

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "Este e-mail ja esta cadastrado." },
        { status: 409 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: "Este nome de usuario ja esta em uso." },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Generate unique affiliate code
    let affiliateCode = generateAffiliateCode()
    let codeExists = await prisma.user.findUnique({
      where: { affiliateCode },
      select: { id: true },
    })
    while (codeExists) {
      affiliateCode = generateAffiliateCode()
      codeExists = await prisma.user.findUnique({
        where: { affiliateCode },
        select: { id: true },
      })
    }

    // Generate API key
    const apiKey = generateApiKey()

    // Handle referral
    let referredById: number | null = null
    const refCode = body.ref as string | undefined

    if (refCode) {
      const referrer = await prisma.user.findUnique({
        where: { affiliateCode: refCode },
        select: { id: true },
      })
      if (referrer) {
        referredById = referrer.id
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        affiliateCode,
        apiKey,
        referredById,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
      },
    })

    // Log registration
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        ip,
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `New user registered: ${user.email}${referredById ? ` (referred by user ${referredById})` : ""}`,
        severity: "INFO",
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso!",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 }
    )
  }
}
