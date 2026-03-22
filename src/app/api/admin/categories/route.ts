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

export async function GET() {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { sortOrder: "asc" },
    })

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      servicesCount: c._count.services,
      createdAt: c.createdAt.toISOString(),
    }))

    return NextResponse.json({ categories: formatted })
  } catch (error) {
    console.error("Admin categories GET error:", error)
    return NextResponse.json({ error: "Erro ao carregar categorias" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

    const existing = await prisma.category.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    })

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_CREATE_CATEGORY",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Criou categoria "${name}" (slug: ${finalSlug})`,
        severity: "INFO",
      },
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error("Admin categories POST error:", error)
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, slug, sortOrder, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder)
    if (isActive !== undefined) data.isActive = isActive

    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data,
    })

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_UPDATE_CATEGORY",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Atualizou categoria #${id}: ${JSON.stringify(data)}`,
        severity: "INFO",
      },
    })

    return NextResponse.json({ success: true, category: updated })
  } catch (error) {
    console.error("Admin categories PATCH error:", error)
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    await prisma.category.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    await prisma.securityLog.create({
      data: {
        userId: adminId,
        action: "ADMIN_DEACTIVATE_CATEGORY",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        details: `Desativou categoria #${id}`,
        severity: "WARN",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin categories DELETE error:", error)
    return NextResponse.json({ error: "Erro ao desativar categoria" }, { status: 500 })
  }
}
