import { useQueryClient, useMutation } from "@tanstack/react-query"
import { menuItemsApi } from "@/lib/api"
import type { MenuItem } from "@/types"

type MenuItemPayload = {
  name: string; price: number; category_id: number
  available: boolean; image: string | null
  recipe: { inventory_id: number; deduct_qty: number }[]
}

export function useMenuItemMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["menu-items"] })

  const create = useMutation({
    mutationFn: (payload: MenuItemPayload) => menuItemsApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<MenuItemPayload> }) =>
      menuItemsApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => menuItemsApi.delete(id),
    onSuccess: invalidate,
  })

  const toggleAvailable = useMutation({
    mutationFn: (item: MenuItem) => menuItemsApi.update(item.id, { available: !item.available }),
    onSuccess: invalidate,
  })

  return { create, update, remove, toggleAvailable, invalidate }
}