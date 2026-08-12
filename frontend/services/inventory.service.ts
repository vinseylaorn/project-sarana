import { inventoryApi, stockHistoryApi } from "@/lib/api"
import type { InventoryItem }            from "@/types"

export const inventoryService = {
  async stockIn(inventory_id: number, qty: number, reason?: string) {
    return stockHistoryApi.create({ inventory_id, type: "IN", qty, reason })
  },

  async stockOut(inventory_id: number, qty: number, reason?: string) {
    return stockHistoryApi.create({ inventory_id, type: "OUT", qty, reason })
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const items = await inventoryApi.list()
    return items.filter(i => i.stock <= i.min_stock)
  },

  isLowStock(item: InventoryItem): boolean {
    return item.stock <= item.min_stock
  },
}