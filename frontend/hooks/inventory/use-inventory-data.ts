import { useQuery } from "@tanstack/react-query"
import { inventoryApi, stockCategoriesApi, suppliersApi } from "@/lib/api"
import type { InventoryItem, StockCategory, Supplier } from "@/types"

export function useInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: () => inventoryApi.list(),
  })
}

export function useStockCategories() {
  return useQuery<StockCategory[]>({
    queryKey: ["stock-categories"],
    queryFn: () => stockCategoriesApi.list(),
  })
}

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.list(),
  })
}