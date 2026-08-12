import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { inventoryApi } from "@/lib/api"
import type { InventoryItem } from "@/types"

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: () =>
      inventoryApi.list().catch(() => [] as InventoryItem[]) as Promise<InventoryItem[]>,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}