import { useQueryClient, useMutation } from "@tanstack/react-query"
import { menuCategoriesApi, menuItemsApi } from "@/lib/api"
import type { MenuItem } from "@/types"

export function useMenuCategoryMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["menu-categories"] })
    queryClient.invalidateQueries({ queryKey: ["menu-items"] })
  }

  const create = useMutation({
    mutationFn: (name: string) => menuCategoriesApi.create({ name }),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      menuCategoriesApi.update(id, { name }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async ({ id, itemsToRemove }: { id: number; itemsToRemove: MenuItem[] }) => {
      if (itemsToRemove.length > 0) {
        await Promise.all(itemsToRemove.map((i) => menuItemsApi.delete(i.id)))
      }
      await menuCategoriesApi.delete(id)
    },
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}