// lib/api/menu.ts

import { get, post, put, del }              from "./client"
import type { MenuCategory, MenuItem }      from "@/types"

export const menuCategoriesApi = {
  list:   ()                                      => get<MenuCategory[]>("/menu-categories"),
  create: (payload: { name: string })             => post<MenuCategory>("/menu-categories", payload),
  update: (id: number, payload: { name: string }) => put<MenuCategory>(`/menu-categories/${id}`, payload),
  delete: (id: number)                            => del<{ message: string }>(`/menu-categories/${id}`),
}

export const menuItemsApi = {
  list:   ()           => get<MenuItem[]>("/menu-items"),
  get:    (id: number) => get<MenuItem>(`/menu-items/${id}`),

  create: (payload: {
    category_id: number
    name:        string
    price:       number
    image?:      string | null
    available?:  boolean
    recipe?:     { inventory_id: number; deduct_qty: number }[]
  }) => post<MenuItem>("/menu-items", payload),

  update: (id: number, payload: Partial<{
    category_id: number
    name:        string
    price:       number
    image:       string | null
    available:   boolean
    recipe:      { inventory_id: number; deduct_qty: number }[]
  }>) => put<MenuItem>(`/menu-items/${id}`, payload),
  delete: (id: number) => del<{ message: string }>(`/menu-items/${id}`),
}