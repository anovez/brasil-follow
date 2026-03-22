import { useQuery } from "@tanstack/react-query"

interface Order {
  id: number
  serviceId: number
  serviceName: string
  link: string
  quantity: number
  amount: number
  status: string
  startCount: number | null
  remains: number | null
  providerOrderId: string | null
  createdAt: string
  updatedAt: string
}

interface OrdersResponse {
  items: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface UseOrdersParams {
  page?: number
  limit?: number
  status?: string
}

async function fetchOrders(params: UseOrdersParams): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.status) searchParams.set("status", params.status)

  const res = await fetch(`/api/orders?${searchParams.toString()}`)
  if (!res.ok) {
    throw new Error("Falha ao buscar pedidos")
  }
  return res.json()
}

export function useOrders(params: UseOrdersParams = {}) {
  const { page = 1, limit = 10, status } = params

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders", page, limit, status],
    queryFn: () => fetchOrders({ page, limit, status }),
    staleTime: 15 * 1000,
    retry: 2,
  })

  return {
    orders: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    refetch,
  }
}
