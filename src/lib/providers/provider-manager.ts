import prisma from '../prisma'
import { GenericSMMProvider } from './generic-provider'
import { decrypt } from '../encryption'
import { mapProviderStatus } from './base'
import type { SMMProvider } from './base'

export class ProviderManager {
  // Get a provider instance by ID
  static async getProvider(providerId: number): Promise<SMMProvider> {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } })
    if (!provider) throw new Error('Provider not found')

    const decryptedKey = decrypt(provider.apiKey)
    return new GenericSMMProvider(provider.name, provider.apiUrl, decryptedKey)
  }

  // Import all services from a provider
  static async importServices(providerId: number, markup: number, autoCreateCategories = true) {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } })
    if (!provider) throw new Error('Provider not found')

    const smmProvider = await this.getProvider(providerId)
    const services = await smmProvider.getServices()

    const results = { imported: 0, skipped: 0, categories: 0 }

    // Group by category
    const categoryMap = new Map<string, number>()

    for (const svc of services) {
      // Find or create category
      let categoryId = categoryMap.get(svc.category)
      if (!categoryId) {
        const slug = svc.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        let category = await prisma.category.findUnique({ where: { slug } })
        if (!category && autoCreateCategories) {
          category = await prisma.category.create({
            data: { name: svc.category, slug, sortOrder: 0, isActive: true }
          })
          results.categories++
        }
        if (category) {
          categoryId = category.id
          categoryMap.set(svc.category, categoryId)
        }
      }
      if (!categoryId) { results.skipped++; continue }

      // Calculate prices
      let costBRL = parseFloat(svc.rate)
      if (provider.currency === 'USD') {
        costBRL = costBRL * Number(provider.exchangeRate)
      }
      const priceWithMarkup = costBRL * (1 + markup / 100)

      // Upsert service
      const existing = await prisma.service.findFirst({
        where: { providerId, providerServiceId: String(svc.service) }
      })

      if (existing) {
        await prisma.service.update({
          where: { id: existing.id },
          data: {
            costPerThousand: costBRL,
            pricePerThousand: priceWithMarkup,
            minQuantity: svc.min,
            maxQuantity: svc.max,
            dripfeed: svc.dripfeed,
            refill: svc.refill,
            name: svc.name,
          }
        })
      } else {
        await prisma.service.create({
          data: {
            categoryId,
            name: svc.name,
            pricePerThousand: priceWithMarkup,
            costPerThousand: costBRL,
            minQuantity: svc.min,
            maxQuantity: svc.max,
            providerServiceId: String(svc.service),
            providerId,
            type: svc.type === 'Default' ? 'DEFAULT' : svc.type === 'Premium' ? 'PREMIUM' : 'DEFAULT',
            dripfeed: svc.dripfeed,
            refill: svc.refill,
            isActive: true,
          }
        })
      }
      results.imported++
    }

    // Update provider balance
    const balance = await smmProvider.getBalance()
    await prisma.provider.update({ where: { id: providerId }, data: { balance } })

    return results
  }

  // Sync a single order status with provider
  static async syncOrder(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { service: { include: { provider: true } } }
    })
    if (!order || !order.providerOrderId) return null

    const provider = await this.getProvider(order.service.providerId)
    const status = await provider.getOrderStatus(order.providerOrderId)
    const mappedStatus = mapProviderStatus(status.status)

    // Handle partial refund
    let refundAmount = 0
    if (mappedStatus === 'PARTIAL' && status.remains > 0) {
      const pricePerUnit = Number(order.amount) / order.quantity
      refundAmount = status.remains * pricePerUnit
    }

    // Handle full refund for cancelled orders
    if (mappedStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
      refundAmount = Number(order.amount)
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: mappedStatus,
        startCount: status.startCount || order.startCount,
        remains: status.remains,
      }
    })

    // Handle refund for cancelled/partial orders
    if ((mappedStatus === 'CANCELLED' || mappedStatus === 'PARTIAL') && refundAmount > 0) {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: order.userId } })
        if (!user) return
        const newBalance = Number(user.balance) + refundAmount
        await tx.user.update({ where: { id: order.userId }, data: { balance: newBalance } })
        await tx.balanceLog.create({
          data: {
            userId: order.userId,
            amount: refundAmount,
            balanceAfter: newBalance,
            type: 'REFUND',
            description: `Reembolso pedido #${order.id} (${mappedStatus})`,
          }
        })
      })
    }

    return { orderId, status: mappedStatus, startCount: status.startCount, remains: status.remains }
  }

  // Sync all active orders
  static async syncAllActiveOrders() {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING', 'IN_PROGRESS'] },
        providerOrderId: { not: null },
      },
      include: { service: true },
      take: 100,
    })

    const results = []
    for (const order of activeOrders) {
      try {
        const result = await this.syncOrder(order.id)
        if (result) results.push(result)
      } catch (error) {
        results.push({ orderId: order.id, error: String(error) })
      }
    }
    return results
  }

  // Send order to provider
  static async sendOrderToProvider(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { service: true }
    })
    if (!order) throw new Error('Order not found')

    const provider = await this.getProvider(order.service.providerId)
    const result = await provider.createOrder(
      order.service.providerServiceId,
      order.link,
      order.quantity
    )

    await prisma.order.update({
      where: { id: orderId },
      data: {
        providerOrderId: result.orderId,
        status: 'PROCESSING',
      }
    })

    return result
  }
}
