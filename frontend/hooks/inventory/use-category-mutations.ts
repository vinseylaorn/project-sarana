import { useQueryClient, useMutation } from "@tanstack/react-query"
import { inventoryApi, stockCategoriesApi, suppliersApi } from "@/lib/api"
import type { InventoryItem, Supplier } from "@/types"

export function useStockCategoryMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["stock-categories"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["suppliers"] })
  }

  const create = useMutation({
    mutationFn: (name: string) => stockCategoriesApi.create({ name }),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      stockCategoriesApi.update(id, { name }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async ({
      id,
      itemsToRemove,
      suppliersToRemove,
    }: {
      id: number
      itemsToRemove: InventoryItem[]
      suppliersToRemove: Supplier[]
    }) => {
      if (itemsToRemove.length > 0) {
        await Promise.all(itemsToRemove.map((i) => inventoryApi.delete(i.id)))
      }
      if (suppliersToRemove.length > 0) {
        await Promise.all(suppliersToRemove.map((s) => suppliersApi.delete(s.id)))
      }
      await stockCategoriesApi.delete(id)
    },
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}