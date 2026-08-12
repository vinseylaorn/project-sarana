// lib/api/inventory.ts

import { get, post, put, del }                                           from "./client"
import type { StockCategory, InventoryItem, StockHistory, Spoilage }    from "@/types"

export const stockCategoriesApi = {
  list:   ()                                      => get<StockCategory[]>("/stock-categories"),
  create: (payload: { name: string })             => post<StockCategory>("/stock-categories", payload),
  update: (id: number, payload: { name: string }) => put<StockCategory>(`/stock-categories/${id}`, payload),
  delete: (id: number)                            => del<{ message: string }>(`/stock-categories/${id}`),
}

export const inventoryApi = {
  list:   ()           => get<InventoryItem[]>("/inventories"),
  get:    (id: number) => get<InventoryItem>(`/inventories/${id}`),

  create: (payload: Omit<InventoryItem, "id" | "category" | "created_at">) =>
    post<InventoryItem>("/inventories", payload),

  update: (id: number, payload: Partial<Omit<InventoryItem, "id" | "category" | "created_at">>) =>
    put<InventoryItem>(`/inventories/${id}`, payload),

  delete: (id: number) => del<{ message: string }>(`/inventories/${id}`),
}

export const stockHistoryApi = {
  list: (params?: {
    type?:       string
    search?:     string
    start_date?: string
    end_date?:   string
  }) => {
    const q = new URLSearchParams()
    if (params?.type && params.type !== "ALL") q.set("type",       params.type)
    if (params?.search)                        q.set("search",     params.search)
    if (params?.start_date)                    q.set("start_date", params.start_date)
    if (params?.end_date)                      q.set("end_date",   params.end_date)
    const qs = q.toString()
    return get<StockHistory[]>(`/stock-history${qs ? "?" + qs : ""}`)
  },

  create: (payload: {
    inventory_id: number
    type:         "IN" | "OUT"
    qty:          number
    reason?:      string
  }) => post<StockHistory>("/stock-history", payload),
}

export const spoilageApi = {
  list: (params?: {
    search?:      string
    category_id?: number
    start_date?:  string
    end_date?:    string
  }) => {
    const q = new URLSearchParams()
    if (params?.search)      q.set("search",      params.search)
    if (params?.category_id) q.set("category_id", String(params.category_id))
    if (params?.start_date)  q.set("start_date",  params.start_date)
    if (params?.end_date)    q.set("end_date",     params.end_date)
    const qs = q.toString()
    return get<Spoilage[]>(`/spoilages${qs ? "?" + qs : ""}`)
  },

  create: (payload: {
    inventory_id: number
    qty:          number
    date:         string
    description?: string
  }) => post<Spoilage>("/spoilages", payload),

  update: (id: number, payload: {
    qty:          number
    date:         string
    description?: string
  }) => put<Spoilage>(`/spoilages/${id}`, payload),

  delete: (id: number) => del<{ message: string }>(`/spoilages/${id}`),
}