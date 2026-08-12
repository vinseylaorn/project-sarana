import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { menuCategoriesApi, menuItemsApi } from "@/lib/api"
import type { MenuCategory, MenuItem } from "@/types"

export function useMenuCategories() {
  return useQuery({
    queryKey: ["menu-categories"],
    queryFn: () => menuCategoriesApi.list() as Promise<MenuCategory[]>,
    staleTime: 10 * 60 * 1000, 
    placeholderData: keepPreviousData, 
  })
}

export function useMenuItems() {
  return useQuery({
    queryKey: ["menu-items"],
    queryFn: () => menuItemsApi.list() as Promise<MenuItem[]>,
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}