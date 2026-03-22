export interface SMMProvider {
  name: string
  getBalance(): Promise<number>
  getServices(): Promise<ProviderService[]>
  createOrder(serviceId: string, link: string, quantity: number): Promise<{ orderId: string }>
  getOrderStatus(orderId: string): Promise<OrderStatus>
  getMultiOrderStatus(orderIds: string[]): Promise<OrderStatus[]>
}

export interface ProviderService {
  service: number
  name: string
  type: string
  rate: string
  min: number
  max: number
  dripfeed: boolean
  refill: boolean
  cancel: boolean
  category: string
}

export interface OrderStatus {
  orderId: string
  status: string
  charge: string
  startCount: number
  remains: number
}

// Map provider status to our internal status
export function mapProviderStatus(providerStatus: string): string {
  const statusMap: Record<string, string> = {
    'Pending': 'PENDING',
    'Processing': 'PROCESSING',
    'In progress': 'IN_PROGRESS',
    'Completed': 'COMPLETED',
    'Partial': 'PARTIAL',
    'Cancelled': 'CANCELLED',
    'Canceled': 'CANCELLED',
    'Refunded': 'REFUNDED',
  }
  return statusMap[providerStatus] || 'PENDING'
}
