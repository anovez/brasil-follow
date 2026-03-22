import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit"
import { ProviderManager } from "@/lib/providers/provider-manager"
import { calculateLevelDiscount } from "@/lib/utils"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    // Parse body (support both JSON and form-urlencoded)
    let body: Record<string, string>
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      body = await req.json()
    } else {
      const formData = await req.formData()
      body = Object.fromEntries(formData) as Record<string, string>
    }

    const { key, action } = body
    if (!key || !action) {
      return Response.json({ error: "Missing key or action" }, { status: 400 })
    }

    // Rate limit by API key
    const rateCheck = checkRateLimit(`api:${key}`, RATE_LIMITS.api)
    if (!rateCheck.success) return rateLimitResponse(rateCheck.retryAfter)

    // Authenticate user by API key (timing-safe comparison not needed here since we DB lookup)
    const user = await prisma.user.findUnique({ where: { apiKey: key } })
    if (!user || user.status !== "ACTIVE") {
      return Response.json({ error: "Invalid API key" }, { status: 401 })
    }

    switch (action) {
      case "balance": {
        return Response.json({
          balance: Number(user.balance).toFixed(2),
          currency: "BRL",
        })
      }

      case "services": {
        const services = await prisma.service.findMany({
          where: { isActive: true },
          include: { category: true },
          orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        })
        return Response.json(
          services.map((s) => ({
            service: s.id,
            name: s.name,
            type: s.type === "DEFAULT" ? "Default" : s.type,
            rate: Number(s.pricePerThousand).toFixed(4),
            min: s.minQuantity,
            max: s.maxQuantity,
            dripfeed: s.dripfeed,
            refill: s.refill,
            cancel: false,
            category: s.category.name,
          }))
        )
      }

      case "add": {
        const serviceId = parseInt(body.service)
        const link = body.link
        const quantity = parseInt(body.quantity)

        if (!serviceId || !link || !quantity) {
          return Response.json({ error: "Missing service, link, or quantity" }, { status: 400 })
        }

        // Validate URL safety
        try {
          const url = new URL(link)
          const forbidden = ["localhost", "127.0.0.1", "0.0.0.0"]
          if (forbidden.some((h) => url.hostname.includes(h))) {
            return Response.json({ error: "Invalid link" }, { status: 400 })
          }
        } catch {
          return Response.json({ error: "Invalid link" }, { status: 400 })
        }

        const service = await prisma.service.findFirst({
          where: { id: serviceId, isActive: true },
          include: { provider: true },
        })
        if (!service) {
          return Response.json({ error: "Invalid service ID" }, { status: 400 })
        }

        if (quantity < service.minQuantity || quantity > service.maxQuantity) {
          return Response.json({
            error: `Quantity must be between ${service.minQuantity} and ${service.maxQuantity}`,
          }, { status: 400 })
        }

        // Calculate amount with level discount
        const baseAmount = (quantity / 1000) * Number(service.pricePerThousand)
        const discount = calculateLevelDiscount(user.level)
        const amount = Math.round((baseAmount * (1 - discount / 100)) * 100) / 100
        const cost = (quantity / 1000) * Number(service.costPerThousand)
        const profit = Math.round((amount - cost) * 100) / 100

        if (Number(user.balance) < amount) {
          return Response.json({ error: "Insufficient balance" }, { status: 400 })
        }

        // Atomic transaction
        const order = await prisma.$transaction(async (tx) => {
          const freshUser = await tx.user.findUnique({ where: { id: user.id } })
          if (!freshUser || Number(freshUser.balance) < amount) {
            throw new Error("Insufficient balance")
          }

          const newBalance = Number(freshUser.balance) - amount
          await tx.user.update({
            where: { id: user.id },
            data: {
              balance: newBalance,
              totalSpent: { increment: amount },
            },
          })

          const newOrder = await tx.order.create({
            data: {
              userId: user.id,
              serviceId: service.id,
              link,
              quantity,
              amount,
              cost,
              profit,
              status: "PENDING",
            },
          })

          await tx.balanceLog.create({
            data: {
              userId: user.id,
              amount: -amount,
              balanceAfter: newBalance,
              type: "ORDER",
              description: `Pedido #${newOrder.id} via API - ${service.name}`,
            },
          })

          return newOrder
        })

        // Send to provider (async, don't wait)
        ProviderManager.getProvider(service.providerId)
          .then((provider) =>
            provider.createOrder(service.providerServiceId, link, quantity)
          )
          .then((result) =>
            prisma.order.update({
              where: { id: order.id },
              data: { providerOrderId: result.orderId, status: "PROCESSING" },
            })
          )
          .catch(() =>
            prisma.order.update({
              where: { id: order.id },
              data: { status: "PENDING" },
            })
          )

        return Response.json({ order: order.id })
      }

      case "status": {
        if (body.orders) {
          // Multi-status
          const ids = body.orders.split(",").map((id) => parseInt(id.trim())).filter(Boolean)
          const orders = await prisma.order.findMany({
            where: { id: { in: ids }, userId: user.id },
          })
          const result: Record<string, any> = {}
          for (const o of orders) {
            result[o.id] = {
              charge: Number(o.amount).toFixed(2),
              start_count: String(o.startCount || 0),
              status: o.status === "IN_PROGRESS" ? "In progress" : o.status.charAt(0) + o.status.slice(1).toLowerCase(),
              remains: String(o.remains || 0),
              currency: "BRL",
            }
          }
          return Response.json(result)
        }

        const orderId = parseInt(body.order)
        if (!orderId) return Response.json({ error: "Missing order ID" }, { status: 400 })

        const order = await prisma.order.findFirst({
          where: { id: orderId, userId: user.id },
        })
        if (!order) return Response.json({ error: "Incorrect order ID" }, { status: 400 })

        // Map status back to industry format
        const statusMap: Record<string, string> = {
          PENDING: "Pending",
          PROCESSING: "Processing",
          IN_PROGRESS: "In progress",
          COMPLETED: "Completed",
          PARTIAL: "Partial",
          CANCELLED: "Cancelled",
          REFUNDED: "Refunded",
        }

        return Response.json({
          charge: Number(order.amount).toFixed(2),
          start_count: String(order.startCount || 0),
          status: statusMap[order.status] || order.status,
          remains: String(order.remains || 0),
          currency: "BRL",
        })
      }

      case "cancel": {
        const orderId = parseInt(body.order)
        if (!orderId) return Response.json({ error: "Missing order ID" }, { status: 400 })

        const order = await prisma.order.findFirst({
          where: { id: orderId, userId: user.id, status: { in: ["PENDING", "PROCESSING"] } },
        })
        if (!order) return Response.json({ error: "Incorrect order ID" }, { status: 400 })

        // Refund
        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } })
          const freshUser = await tx.user.findUnique({ where: { id: user.id } })
          const newBal = Number(freshUser!.balance) + Number(order.amount)
          await tx.user.update({ where: { id: user.id }, data: { balance: newBal } })
          await tx.balanceLog.create({
            data: {
              userId: user.id,
              amount: Number(order.amount),
              balanceAfter: newBal,
              type: "REFUND",
              description: `Cancelamento pedido #${order.id} via API`,
            },
          })
        })

        return Response.json({ cancel: "1" })
      }

      case "refill": {
        const orderId = parseInt(body.order)
        if (!orderId) return Response.json({ error: "Missing order ID" }, { status: 400 })

        const order = await prisma.order.findFirst({
          where: { id: orderId, userId: user.id, status: "COMPLETED" },
          include: { service: true },
        })
        if (!order || !order.service.refill) {
          return Response.json({ error: "Refill not available for this order" }, { status: 400 })
        }

        return Response.json({ refill: "1" })
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("API v2 error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
