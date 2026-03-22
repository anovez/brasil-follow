import { useQuery } from "@tanstack/react-query"

interface BalanceResponse {
  balance: number
}

async function fetchBalance(): Promise<BalanceResponse> {
  const res = await fetch("/api/balance")
  if (!res.ok) {
    throw new Error("Falha ao buscar saldo")
  }
  return res.json()
}

export function useBalance() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["balance"],
    queryFn: fetchBalance,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  })

  return {
    balance: data?.balance ?? 0,
    isLoading,
    error,
    refetch,
  }
}
