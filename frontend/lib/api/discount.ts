// lib/api/discount.ts
import { get, post, put, del } from "./client"

type DiscountStatus = "active" | "inactive" | "scheduled" | "expired"

interface DiscountPayload {
  name:               string
  scope:              "category" | "product"
  value_type:         "percentage" | "flat"
  value:              number
  target_ids:         number[]
  start_date?:        string
  end_date?:          string
  status:             DiscountStatus
  min_order_amount?:  number
  description?:       string
}

export const discountsApi = {
  list: () =>
    get<any[]>("/discounts"),

  create: (data: Omit<DiscountPayload, "status"> & { status: Exclude<DiscountStatus, "expired"> }) =>
    post<any>("/discounts", data),

  update: (id: number, data: Partial<DiscountPayload>) =>
    put<any>(`/discounts/${id}`, data),

  delete: (id: number) =>
    del<void>(`/discounts/${id}`),
}