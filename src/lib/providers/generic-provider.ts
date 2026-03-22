import type { SMMProvider, ProviderService, OrderStatus } from './base'

export class GenericSMMProvider implements SMMProvider {
  name: string
  private apiUrl: string
  private apiKey: string

  constructor(name: string, apiUrl: string, apiKey: string) {
    this.name = name
    this.apiUrl = apiUrl
    this.apiKey = apiKey
  }

  private async request(params: Record<string, string>): Promise<any> {
    const body = new URLSearchParams({ key: this.apiKey, ...params })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal,
      })
      return await res.json()
    } finally {
      clearTimeout(timeout)
    }
  }

  async getBalance(): Promise<number> {
    const data = await this.request({ action: 'balance' })
    return parseFloat(data.balance || '0')
  }

  async getServices(): Promise<ProviderService[]> {
    const data = await this.request({ action: 'services' })
    if (!Array.isArray(data)) return []
    return data.map((s: any) => ({
      service: Number(s.service),
      name: String(s.name || ''),
      type: String(s.type || 'Default'),
      rate: String(s.rate || '0'),
      min: Number(s.min || 0),
      max: Number(s.max || 0),
      dripfeed: Boolean(s.dripfeed),
      refill: Boolean(s.refill),
      cancel: Boolean(s.cancel),
      category: String(s.category || 'Other'),
    }))
  }

  async createOrder(serviceId: string, link: string, quantity: number): Promise<{ orderId: string }> {
    const data = await this.request({
      action: 'add',
      service: serviceId,
      link,
      quantity: String(quantity),
    })
    if (data.error) throw new Error(data.error)
    return { orderId: String(data.order) }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const data = await this.request({ action: 'status', order: orderId })
    return {
      orderId,
      status: data.status || 'Unknown',
      charge: String(data.charge || '0'),
      startCount: Number(data.start_count || 0),
      remains: Number(data.remains || 0),
    }
  }

  async getMultiOrderStatus(orderIds: string[]): Promise<OrderStatus[]> {
    const data = await this.request({ action: 'status', orders: orderIds.join(',') })
    return orderIds.map(id => ({
      orderId: id,
      status: data[id]?.status || 'Unknown',
      charge: String(data[id]?.charge || '0'),
      startCount: Number(data[id]?.start_count || 0),
      remains: Number(data[id]?.remains || 0),
    }))
  }
}
