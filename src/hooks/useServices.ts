import { useQuery } from "@tanstack/react-query"

interface Service {
  id: number
  name: string
  categoryId: number
  categoryName: string
  pricePerUnit: number
  minQuantity: number
  maxQuantity: number
  description: string | null
  isActive: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  serviceCount: number
}

interface ServicesResponse {
  services: Service[]
  categories: Category[]
}

interface UseServicesParams {
  categoryId?: number
}

async function fetchServices(params: UseServicesParams): Promise<ServicesResponse> {
  const searchParams = new URLSearchParams()
  if (params.categoryId) {
    searchParams.set("categoryId", String(params.categoryId))
  }

  const res = await fetch(`/api/services?${searchParams.toString()}`)
  if (!res.ok) {
    throw new Error("Falha ao buscar serviços")
  }
  return res.json()
}

export function useServices(params: UseServicesParams = {}) {
  const { categoryId } = params

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["services", categoryId],
    queryFn: () => fetchServices({ categoryId }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  return {
    services: data?.services ?? [],
    categories: data?.categories ?? [],
    isLoading,
    error,
    refetch,
  }
}
