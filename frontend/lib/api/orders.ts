// lib/api/orders.ts

import { get, post, put } from "./client"
import type { Order, OrderItem } from "@/types"

export const ordersApi = {
  list: () => get<Order[]>("/orders"),
  get:  (id: number) => get<Order>(`/orders/${id}`),

  listAll: (params: { start_date?: string; end_date?: string } = {}) => {
    const qs = new URLSearchParams()
    if (params.start_date) qs.set("start_date", params.start_date)
    if (params.end_date)   qs.set("end_date",   params.end_date)
    const query = qs.toString() ? `?${qs.toString()}` : ""
    return get<Order[]>(`/orders${query}`)
  },

  create: (payload: {
    table_name?: string
    order_type?: string
    staff_id?:   number | null
    items:       OrderItem[]
  }) => post<Order>("/orders", payload),

  updateItems: (id: number, items: {
    menu_item_id:         number
    name:                 string
    price:                number
    original_price?:      number | null
    quantity:             number
    note?:                string | null 
    discount_name?:       string | null
    discount_value?:      number | null
    discount_value_type?: "percentage" | "flat" | null
  }[]) => put(`/orders/${id}/items`, { items }),

  complete: (
    id: number,
    payment_method: string,
    vip_card_id?: number | null,
    financials?: {
      discount_amount?:     number
      tax_amount?:          number
      vip_discount_amount?: number
      final_total?:         number
    }
  ) =>
    put<Order>(`/orders/${id}/complete`, {
      payment_method,
      ...(vip_card_id ? { vip_card_id } : {}),
      ...(financials ?? {}),
    }),
}