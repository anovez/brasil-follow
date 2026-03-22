import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRateLimit(`services:${ip}`, RATE_LIMITS.general)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.retryAfter)
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const where: any = { isActive: true }
    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId, 10)
      if (isNaN(parsedCategoryId)) {
        return NextResponse.json({ error: 'categoryId inválido' }, { status: 400 })
      }
      where.categoryId = parsedCategoryId
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    // Return services without exposing cost data
    const publicServices = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      pricePerThousand: Number(service.pricePerThousand),
      minQuantity: service.minQuantity,
      maxQuantity: service.maxQuantity,
      type: service.type,
      averageTime: service.averageTime,
      quality: service.quality,
      dripfeed: service.dripfeed,
      refill: service.refill,
      refillDays: service.refillDays,
      category: service.category,
    }))

    // Also fetch categories for filtering
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            services: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        services: publicServices,
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          serviceCount: c._count.services,
        })),
      },
    })
  } catch (error) {
    console.error('Services route error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
