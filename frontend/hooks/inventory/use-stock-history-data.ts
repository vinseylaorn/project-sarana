import { useQuery  } from "@tanstack/react-query"
import { stockHistoryApi } from "@/lib/api"
import type { StockHistory } from "@/types"

type Filters = {
  type?: string
  search?: string
  start_date?: string
  end_date?: string
}

export function useStockHistory(filters: Filters) {
  return useQuery({
    queryKey: ["stock-history", filters],
    queryFn: () => stockHistoryApi.list(filters) as Promise<StockHistory[]>,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })
}