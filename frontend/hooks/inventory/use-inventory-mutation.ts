import { useQueryClient, useMutation } from "@tanstack/react-query"
import { inventoryApi } from "@/lib/api"
import type { InventoryItem } from "@/types"

interface InventoryPayload {
  category_id: number
  name: string
  unit: string
  size: InventoryItem["size"]
  stock: number
  min_stock: number
  supplier_id: number | null
}

export function useInventoryMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }

  const create = useMutation({
    mutationFn: (payload: InventoryPayload) => inventoryApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InventoryPayload }) =>
      inventoryApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => inventoryApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}